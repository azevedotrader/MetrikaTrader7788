const crypto = require('crypto');

// Implementação de teste seguindo exatamente a especificação oficial da Gate.io
function createGateioSignature(apiKey, apiSecret, method, url, queryString = '', payload = '') {
    const timestamp = Math.floor(Date.now() / 1000);
    
    // SHA512 hash of payload (simple hash, not HMAC)
    const hashedPayload = crypto.createHash('sha512').update(payload || '').digest('hex');
    
    // Signature string format: METHOD\nURL\nQUERY\nHASHED_PAYLOAD\nTIMESTAMP
    const signString = `${method.toUpperCase()}\n${url}\n${queryString}\n${hashedPayload}\n${timestamp}`;
    
    // HMAC SHA512 signature
    const signature = crypto.createHmac('sha512', apiSecret).update(signString).digest('hex');
    
    console.log('=== Gate.io Auth Test ===');
    console.log('Method:', method.toUpperCase());
    console.log('URL:', url);
    console.log('Query String:', queryString || '(empty)');
    console.log('Payload:', payload || '(empty)');
    console.log('Hashed Payload:', hashedPayload);
    console.log('Timestamp:', timestamp);
    console.log('Signature String:', JSON.stringify(signString));
    console.log('API Key:', apiKey.substring(0, 8) + '...');
    console.log('API Secret:', apiSecret.substring(0, 8) + '...');
    console.log('Generated Signature:', signature);
    console.log('========================');
    
    return {
        headers: {
            'KEY': apiKey,
            'Timestamp': timestamp.toString(),
            'SIGN': signature,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    };
}

// Teste com credenciais de exemplo
const testApiKey = '14D7B370-72BB-49BA-AEBA-828169F9B6BF';
const testApiSecret = 'sua-api-secret-aqui';

// Testar assinatura
const testAuth = createGateioSignature(
    testApiKey,
    testApiSecret,
    'GET',
    '/api/v4/spot/accounts',
    '',
    ''
);

console.log('Headers para requisição:', testAuth.headers);

module.exports = { createGateioSignature };