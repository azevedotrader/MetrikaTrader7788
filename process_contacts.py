#!/usr/bin/env python3
import re
import pandas as pd
from typing import List, Dict

def extract_contacts(text: str) -> List[Dict[str, str]]:
    """Extrai contatos do texto formatado"""
    contacts = []
    
    # Padrão regex para capturar os dados dos contatos
    pattern = r'Nome\s+(.*?)\s+CPF\s+([\d.-]+)\s+E-mail\s+([\w.-]+@[\w.-]+)\s+Telefone\s+([\+\d\s-]+?)(?=\s+Nome|\s*$)'
    
    matches = re.findall(pattern, text, re.IGNORECASE)
    
    for match in matches:
        nome, cpf, email, telefone = match
        contacts.append({
            'Nome': nome.strip(),
            'CPF': cpf.strip(),
            'Email': email.strip(),
            'Telefone': telefone.strip()
        })
    
    return contacts

def remove_duplicates(contacts: List[Dict[str, str]]) -> List[Dict[str, str]]:
    """Remove contatos duplicados baseado no CPF"""
    seen_cpfs = set()
    unique_contacts = []
    
    for contact in contacts:
        cpf = contact['CPF'].replace('.', '').replace('-', '').strip()
        if cpf not in seen_cpfs and cpf:  # Evita CPFs vazios
            seen_cpfs.add(cpf)
            unique_contacts.append(contact)
    
    return unique_contacts

# Ler o arquivo
with open('attached_assets/Pasted-Nome-Brun-o-CPF-103-526-857-43-E-mail-brunocm27-gmail-com-Telefone-55-21-98105-2972-Nome-Marcos-Fil-1757104916714_1757104916715.txt', 'r', encoding='utf-8') as f:
    content = f.read()

# Extrair todos os contatos
all_contacts = extract_contacts(content)
print(f"Total de contatos encontrados: {len(all_contacts)}")

# Remover duplicados (baseado no CPF)
unique_contacts = remove_duplicates(all_contacts)
print(f"Contatos únicos (sem duplicados): {len(unique_contacts)}")

# Listar todos os contatos únicos
print("\n=== LISTA DE CONTATOS ÚNICOS ===")
for i, contact in enumerate(unique_contacts, 1):
    print(f"\n{i}. Nome: {contact['Nome']}")
    print(f"   CPF: {contact['CPF']}")
    print(f"   Email: {contact['Email']}")
    print(f"   Telefone: {contact['Telefone']}")

# Criar DataFrame
df = pd.DataFrame(unique_contacts)

# Salvar em arquivo Excel
output_file = 'contatos_unicos.xlsx'
df.to_excel(output_file, index=False, engine='openpyxl')
print(f"\n✅ Arquivo Excel criado: {output_file}")
print(f"📊 Total de contatos únicos salvos: {len(unique_contacts)}")