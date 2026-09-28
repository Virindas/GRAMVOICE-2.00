const ngrok = require('@expo/ngrok');
(async function() {
  try {
    const url = await ngrok.connect(5000);
    console.log('NGROK URL:', url);
  } catch (err) {
    console.error("Ngrok error:", err);
  }
})();
