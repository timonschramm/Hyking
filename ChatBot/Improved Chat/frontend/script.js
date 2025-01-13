// Generate or retrieve user_id
let userId = localStorage.getItem("user_id");
if (!userId) {
    userId = "user_" + Math.random().toString(36).substr(2, 9); // Generate a simple user_id
    localStorage.setItem("user_id", userId);
}

async function sendMessage() {
    const userInput = document.getElementById("user-input").value.trim();
    if (!userInput) return;

    try {
        const response = await fetch("http://127.0.0.1:5003/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                user_input: userInput,
                user_id: userId, // Include user_id here
            }),
        });

        if (!response.ok) {
            throw new Error(`Error: ${response.statusText}`);
        }

        const data = await response.json();
        displayResponse(data.response);
    } catch (error) {
        console.error("Error:", error);
        displayResponse("An error occurred. Please try again.");
    }
}

function displayResponse(message) {
    const chatBox = document.getElementById("chat-box");
    const messageElement = document.createElement("div");
    messageElement.className = "message";
    messageElement.textContent = `🤖 Chatbot: ${message}`;
    chatBox.appendChild(messageElement);
}
