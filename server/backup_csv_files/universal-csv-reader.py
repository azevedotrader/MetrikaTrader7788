#!/usr/bin/env python3
"""
Universal CSV Reader - Função para ler qualquer arquivo CSV automaticamente
==================================================================================

Esta função detecta automaticamente:
- Encoding (UTF-8, ISO-8859-1, Windows-1252, etc.)
- Delimitador (; , | \t : - * e outros)
- Aspas e caracteres de escape
- Quebras de linha dentro de células

Requisitos:
- pandas
- chardet ou charset-normalizer
- csv (built-in)

Autor: Métrika Trading Analytics Platform
Data: Janeiro 2025
"""

import pandas as pd
import chardet
import csv
import io
import os
import re
from typing import Optional, Dict, Any, List, Tuple
import warnings

# Suprimir avisos desnecessários do pandas
warnings.filterwarnings('ignore', category=pd.errors.ParserWarning)

def read_csv_universal(file_path: str, 
                      force_delimiter: Optional[str] = None,
                      force_encoding: Optional[str] = None,
                      max_sample_size: int = 10240,
                      debug: bool = True) -> pd.DataFrame:
    """
    Lê qualquer arquivo CSV automaticamente, detectando encoding e delimitador.
    
    Args:
        file_path (str): Caminho para o arquivo CSV
        force_delimiter (str, optional): Forçar um delimitador específico
        force_encoding (str, optional): Forçar uma codificação específica
        max_sample_size (int): Tamanho máximo da amostra para detecção (bytes)
        debug (bool): Exibir informações de debug
    
    Returns:
        pd.DataFrame: DataFrame com os dados do CSV
    
    Raises:
        FileNotFoundError: Arquivo não encontrado
        ValueError: Arquivo CSV inválido ou vazio
        Exception: Outros erros com sugestões de correção
    """
    
    if debug:
        print(f"📂 Lendo arquivo: {file_path}")
    
    # 1. Verificar se arquivo existe
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Arquivo não encontrado: {file_path}")
    
    # 2. Obter tamanho do arquivo
    file_size = os.path.getsize(file_path)
    if file_size == 0:
        raise ValueError("Arquivo CSV está vazio")
    
    if debug:
        print(f"📏 Tamanho do arquivo: {file_size:,} bytes")
    
    try:
        # 3. Detectar encoding
        encoding = _detect_encoding(file_path, force_encoding, max_sample_size, debug)
        
        # 4. Ler uma amostra para detectar delimitador
        sample_content = _read_sample(file_path, encoding, max_sample_size)
        
        # 5. Detectar delimitador
        delimiter = _detect_delimiter(sample_content, force_delimiter, debug)
        
        # 6. Detectar se tem cabeçalho
        has_header = _detect_header(sample_content, delimiter, debug)
        
        # 7. Configurar pandas para leitura otimizada
        read_params = {
            'filepath_or_buffer': file_path,
            'sep': delimiter,
            'encoding': encoding,
            'header': 0 if has_header else None,
            'skipinitialspace': True,
            'skip_blank_lines': True,
            'na_values': ['', 'NULL', 'null', 'None', 'none', 'N/A', 'n/a', '#N/A'],
            'keep_default_na': True,
            'low_memory': False,  # Evitar avisos de tipos mistos
            'engine': 'python',  # Mais flexível para delimitadores complexos
            'quoting': csv.QUOTE_MINIMAL,
            'doublequote': True,
            'escapechar': None,
            'on_bad_lines': 'warn'  # Avisar sobre linhas problemáticas
        }
        
        # 8. Ler o arquivo com pandas
        try:
            df = pd.read_csv(**read_params)
            
            if debug:
                print(f"✅ Arquivo lido com sucesso!")
                print(f"📊 Dimensões: {df.shape[0]:,} linhas × {df.shape[1]} colunas")
                print(f"🔤 Encoding: {encoding}")
                print(f"📋 Delimitador: '{delimiter}' ({'TAB' if delimiter == '\t' else delimiter})")
                print(f"🏷️ Cabeçalho: {'Sim' if has_header else 'Não'}")
                
                if not df.empty:
                    print(f"📝 Colunas: {list(df.columns)}")
                    print(f"🔍 Primeira linha:")
                    print(df.head(1).to_string(index=False))
            
            # 9. Limpeza básica dos dados
            df = _clean_dataframe(df, debug)
            
            return df
            
        except pd.errors.EmptyDataError:
            raise ValueError("Arquivo CSV não contém dados válidos")
        
        except pd.errors.ParserError as e:
            # Tentar fallback com configurações mais permissivas
            if debug:
                print(f"⚠️ Erro de parsing, tentando fallback: {str(e)}")
            
            return _fallback_read(file_path, encoding, delimiter, debug)
    
    except Exception as e:
        error_msg = f"Erro ao ler CSV: {str(e)}"
        suggestions = _get_error_suggestions(str(e), file_path)
        
        if suggestions:
            error_msg += f"\n\n💡 Sugestões para correção:\n" + "\n".join(f"• {s}" for s in suggestions)
        
        raise Exception(error_msg)


def _detect_encoding(file_path: str, 
                    force_encoding: Optional[str], 
                    max_sample_size: int, 
                    debug: bool) -> str:
    """Detecta o encoding do arquivo"""
    
    if force_encoding:
        if debug:
            print(f"🔤 Encoding forçado: {force_encoding}")
        return force_encoding
    
    # Ler amostra do arquivo
    with open(file_path, 'rb') as f:
        sample = f.read(max_sample_size)
    
    # Usar chardet para detectar encoding
    detection = chardet.detect(sample)
    detected_encoding = detection.get('encoding', 'utf-8')
    confidence = detection.get('confidence', 0)
    
    # Fallbacks comuns para arquivos brasileiros
    if detected_encoding is None or confidence < 0.7:
        # Tentar encodings comuns
        common_encodings = ['utf-8', 'iso-8859-1', 'windows-1252', 'cp1252']
        
        for enc in common_encodings:
            try:
                sample.decode(enc)
                detected_encoding = enc
                if debug:
                    print(f"🔤 Encoding detectado por fallback: {enc}")
                break
            except UnicodeDecodeError:
                continue
    
    if debug:
        print(f"🔤 Encoding detectado: {detected_encoding} (confiança: {confidence:.1%})")
    
    return detected_encoding or 'utf-8'


def _read_sample(file_path: str, encoding: str, max_sample_size: int) -> str:
    """Lê uma amostra do arquivo para análise"""
    
    try:
        with open(file_path, 'r', encoding=encoding, errors='replace') as f:
            content = f.read(max_sample_size)
        return content
    except Exception:
        # Fallback com encoding mais permissivo
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read(max_sample_size)
        return content


def _detect_delimiter(content: str, 
                     force_delimiter: Optional[str], 
                     debug: bool) -> str:
    """Detecta o delimitador mais provável"""
    
    if force_delimiter:
        if debug:
            print(f"📋 Delimitador forçado: '{force_delimiter}'")
        return force_delimiter
    
    # Lista completa de delimitadores possíveis
    delimiters = [';', ',', '\t', '|', ':', ' ', '-', '*', '~', '^', '#']
    
    # Usar csv.Sniffer do Python
    try:
        sniffer = csv.Sniffer()
        sample_lines = content.split('\n')[:10]  # Primeiras 10 linhas
        sample = '\n'.join(sample_lines)
        
        detected = sniffer.sniff(sample, delimiters=''.join(delimiters))
        delimiter = detected.delimiter
        
        if debug:
            print(f"📋 Delimitador detectado pelo Sniffer: '{delimiter}'")
        
        return delimiter
        
    except Exception:
        # Fallback manual se Sniffer falhar
        pass
    
    # Método alternativo: contar ocorrências
    best_delimiter = ','
    max_score = 0
    
    lines = [line.strip() for line in content.split('\n')[:10] if line.strip()]
    
    for delimiter in delimiters:
        if not lines:
            continue
            
        # Contar colunas por linha
        column_counts = []
        for line in lines:
            if delimiter in line:
                cols = len(line.split(delimiter))
                column_counts.append(cols)
        
        if not column_counts:
            continue
        
        # Calcular score baseado em consistência e quantidade
        avg_columns = sum(column_counts) / len(column_counts)
        consistency = sum(1 for count in column_counts 
                         if abs(count - avg_columns) <= 1) / len(column_counts)
        
        score = avg_columns * consistency
        
        # Bonificar delimitadores mais comuns
        if delimiter in [';', ',']:
            score *= 1.5
        elif delimiter == '\t':
            score *= 1.2
        
        if score > max_score and avg_columns > 1:
            max_score = score
            best_delimiter = delimiter
    
    if debug:
        print(f"📋 Delimitador detectado: '{best_delimiter}' ({'TAB' if best_delimiter == '\t' else best_delimiter})")
    
    return best_delimiter


def _detect_header(content: str, delimiter: str, debug: bool) -> bool:
    """Detecta se a primeira linha é um cabeçalho"""
    
    lines = [line.strip() for line in content.split('\n') if line.strip()]
    
    if len(lines) < 2:
        return False
    
    first_row = lines[0].split(delimiter)
    second_row = lines[1].split(delimiter) if len(lines) > 1 else []
    
    # Se número de colunas muito diferente, provavelmente não há header padrão
    if len(second_row) == 0 or abs(len(first_row) - len(second_row)) > 2:
        return False
    
    # Analisar características da primeira linha
    header_score = 0
    data_score = 0
    
    for i, cell in enumerate(first_row):
        cell = cell.strip().strip('"\'')
        
        # Headers típicos
        if re.match(r'^[a-zA-Z_][a-zA-Z0-9_\s\-]*$', cell):
            header_score += 2
        
        # Não números puros
        if not re.match(r'^\d+([.,]\d+)*$', cell) and cell:
            header_score += 1
        
        # Palavras reconhecíveis
        if any(word in cell.lower() for word in 
               ['data', 'nome', 'valor', 'preco', 'quantidade', 'total', 
                'ativo', 'tipo', 'resultado', 'id', 'codigo', 'descricao']):
            header_score += 3
    
    # Analisar segunda linha (dados típicos)
    for cell in second_row[:len(first_row)]:
        cell = cell.strip().strip('"\'')
        
        # Números ou datas
        if re.match(r'^\d+([.,]\d+)*$', cell) or re.match(r'\d{1,2}[/\-]\d{1,2}[/\-]\d{2,4}', cell):
            data_score += 1
    
    has_header = header_score > data_score and header_score > len(first_row) * 0.4
    
    if debug:
        print(f"🏷️ Cabeçalho detectado: {'Sim' if has_header else 'Não'} (score: {header_score} vs {data_score})")
    
    return has_header


def _clean_dataframe(df: pd.DataFrame, debug: bool) -> pd.DataFrame:
    """Limpa e otimiza o DataFrame"""
    
    if df.empty:
        return df
    
    original_shape = df.shape
    
    # Remover linhas completamente vazias
    df = df.dropna(how='all')
    
    # Remover colunas sem nome ou completamente vazias
    df = df.dropna(axis=1, how='all')
    
    # Limpar nomes das colunas
    if not df.columns.empty:
        new_columns = []
        for col in df.columns:
            if pd.isna(col) or str(col).strip() == '':
                new_columns.append(f'coluna_{len(new_columns) + 1}')
            else:
                # Limpar nome da coluna
                clean_name = str(col).strip()
                clean_name = re.sub(r'[^\w\s\-_]', '', clean_name)
                clean_name = re.sub(r'\s+', '_', clean_name)
                new_columns.append(clean_name)
        
        df.columns = new_columns
    
    # Tentar converter colunas numéricas (formato brasileiro)
    for col in df.columns:
        if df[col].dtype == 'object':
            # Tentar converter números brasileiros (1.234,56)
            sample = df[col].dropna().astype(str).head(100)
            if sample.str.match(r'^\d{1,3}(\.\d{3})*(,\d+)?$').any():
                try:
                    df[col] = df[col].astype(str).str.replace('.', '').str.replace(',', '.').astype(float)
                except:
                    pass
    
    if debug and df.shape != original_shape:
        print(f"🧹 Limpeza concluída: {original_shape} → {df.shape}")
    
    return df


def _fallback_read(file_path: str, encoding: str, delimiter: str, debug: bool) -> pd.DataFrame:
    """Tentativa de leitura com configurações mais permissivas"""
    
    if debug:
        print("🔄 Tentando leitura com configurações permissivas...")
    
    fallback_params = {
        'filepath_or_buffer': file_path,
        'sep': delimiter,
        'encoding': encoding,
        'header': None,
        'engine': 'python',
        'error_bad_lines': False,
        'warn_bad_lines': True,
        'skip_blank_lines': True,
        'quoting': csv.QUOTE_ALL,
    }
    
    try:
        df = pd.read_csv(**fallback_params)
        
        if debug:
            print(f"✅ Fallback bem-sucedido: {df.shape}")
        
        return _clean_dataframe(df, debug)
        
    except Exception as e:
        raise Exception(f"Todas as tentativas de leitura falharam: {str(e)}")


def _get_error_suggestions(error: str, file_path: str) -> List[str]:
    """Gera sugestões baseadas no tipo de erro"""
    
    suggestions = []
    
    if "encoding" in error.lower() or "decode" in error.lower():
        suggestions.append("Tente especificar o encoding manualmente: force_encoding='utf-8' ou 'iso-8859-1'")
        suggestions.append("Verifique se o arquivo não está corrompido")
    
    if "delimiter" in error.lower() or "separator" in error.lower():
        suggestions.append("Tente especificar o delimitador manualmente: force_delimiter=';' ou ','")
        suggestions.append("Verifique se o arquivo tem estrutura tabular consistente")
    
    if "empty" in error.lower():
        suggestions.append("Verifique se o arquivo não está vazio")
        suggestions.append("Confirme se o arquivo tem pelo menos uma linha de dados")
    
    if "permission" in error.lower():
        suggestions.append("Verifique as permissões de acesso ao arquivo")
        suggestions.append("Certifique-se de que o arquivo não está sendo usado por outro programa")
    
    # Verificar tamanho do arquivo
    try:
        size = os.path.getsize(file_path)
        if size > 100 * 1024 * 1024:  # > 100MB
            suggestions.append("Arquivo muito grande - considere processar em chunks")
    except:
        pass
    
    return suggestions


# Função de teste e exemplo de uso
def test_csv_reader():
    """Testa o leitor universal com diferentes formatos"""
    
    print("🧪 Testando leitor universal de CSV...")
    
    # Criar arquivos de teste
    test_files = {
        'test_semicolon.csv': 'Nome;Idade;Cidade\nJoão;30;São Paulo\nMaria;25;Rio de Janeiro',
        'test_comma.csv': 'Name,Age,City\nJohn,30,New York\nMary,25,Los Angeles',
        'test_tab.csv': 'Nome\tIdade\tCidade\nJoão\t30\tSão Paulo\nMaria\t25\tRio de Janeiro',
        'test_pipe.csv': 'Nome|Idade|Cidade|João|30|São Paulo|Maria|25|Rio de Janeiro',
    }
    
    for filename, content in test_files.items():
        try:
            # Criar arquivo de teste
            with open(filename, 'w', encoding='utf-8') as f:
                f.write(content)
            
            print(f"\n📝 Testando: {filename}")
            print("-" * 50)
            
            # Ler com função universal
            df = read_csv_universal(filename)
            print(df.to_string(index=False))
            
            # Remover arquivo de teste
            os.remove(filename)
            
        except Exception as e:
            print(f"❌ Erro em {filename}: {str(e)}")


if __name__ == "__main__":
    # Exemplo de uso
    test_csv_reader()
    
    # Exemplo com arquivo real
    # df = read_csv_universal("meu_arquivo.csv", debug=True)
    # print(df.head())