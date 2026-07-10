async function test() {
  const url = "https://versr-ai-browser-verse.hf.space/rag";
  const body = {
    html: "<html><body>This is a test</body></html>",
    query: "What is this?",
    chunk_size: 50,
    overlap: 10,
    top_k: 3,
    title: "Test",
    url: "https://example.com",
    selected_text: "",
    api_key: "YOUR_API_KEY_HERE"
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    
    console.log("Status:", res.status);
    const text = await res.text();
    console.log("Response:", text);
  } catch (err) {
    console.error("Fetch failed:", err);
  }
}
test();
