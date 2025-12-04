const { GoogleGenerativeAI } = require('@google/generative-ai');

const apiKey = 'your-gemini-api-key-here'; // Your placeholder
const genAI = new GoogleGenerativeAI(apiKey);

async function test() {
  try {
    console.log('Testing Gemini with placeholder key...');
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });
    
    const result = await model.generateContent('Say hello');
    const response = await result.response;
    const text = response.text();
    
    console.log('SUCCESS! Response:', text);
  } catch (error) {
    console.log('ERROR:', error.message);
    console.log('Status:', error.status);
    console.log('Details:', error.statusText);
  }
}

test();
