
class Chatbox {
    constructor() {
        this.args = {
            openButton: document.getElementById('chatbox-toggle'),
            chatBox: document.querySelector('.chatbox'),
            sendButton: document.getElementById('chatbox-send'),
            inputField: document.getElementById('chatbox-input'),
            messagesContainer: document.querySelector('.chatbox__messages'),
            chatboxButton: document.querySelector('.chatbox__button'),
            closeButton: document.querySelector('.chatbox__close--button'),
            helpText: document.querySelector('.chatbox__button--text')
        };

        this.state = false;
        this.messages = [];
    }

    display() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        const { openButton, chatBox, sendButton, inputField, chatboxButton, closeButton, helpText } = this.args;

        openButton.addEventListener('click', (event) => {
            event.stopPropagation();
            chatBox.classList.toggle('show');

            if (this.messages.length === 0) this.greetUser();

            this.toggleState();
        });

        sendButton.disabled = true
        sendButton.addEventListener('click', (e) => {
            this.onSendButton()
        });

        inputField.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.onSendButton();
                sendButton.disabled = true

            }
        });

        inputField.addEventListener('input', () => { this.updateButtonState() });

        inputField.addEventListener('paste', () => { setTimeout(this.updateButtonState, 10) });

        document.addEventListener('click', (event) => {
            if (!chatBox.contains(event.target) && !openButton.contains(event.target)) {
                chatBox.classList.remove('show');
                chatboxButton.classList.remove('no-animation');
                helpText.style.display = 'block';
                this.state = false
            }
        });

        closeButton.addEventListener('click', () => {
            chatBox.classList.remove('show');
            this.toggleState();
            chatboxButton.classList.remove('no-animation');
        });
    }

    greetUser() {
        setTimeout(() => {
            let msg = 'Hi. Welcome to Prince Solutions. How can I help you?';
            this.wrapText(msg)
            this.messages.push(msg);
        }, 1000);
    }

    updateButtonState() {
        const { sendButton, inputField } = this.args;
        if (inputField.value.trim() === '') {
            sendButton.disabled = true;
        } else {
            sendButton.disabled = false;
        }
    }

    toggleState() {
        const { chatBox, helpText, chatboxButton } = this.args;
        this.state = !this.state;

        // show or hides the box
        if (this.state) {
            chatBox.classList.add('chatbox--active', 'show');
            chatboxButton.classList.add('no-animation');
            helpText.style.display = 'none';

        } else {
            chatBox.classList.remove('chatbox--active', 'show');
            chatboxButton.classList.remove('no-animation');
            helpText.style.display = 'block';

        }
    }

    wrapText(message, role = 'operator') {
        const { inputField, messagesContainer } = this.args;
        const replyElement = document.createElement('div');
        if (role == 'operator') {
            replyElement.classList.add('chatbot_response');
        } else {
            replyElement.classList.add('message');
        }

        replyElement.innerHTML = `<div class="message__bubble" >${message}</div>`;
        messagesContainer.appendChild(replyElement);
        inputField.value = '';
        messagesContainer.scrollTop = messagesContainer.scrollHeight
    }

    onSendButton() {
        const { inputField } = this.args;
        const messageText = inputField.value.trim();
        if (messageText === "") {
            return;
        }
        this.messages.push(messageText)

        this.wrapText(messageText, 'visitor')

        // Simulating sending message to backend and getting a response
        fetch('http://127.0.0.1:8080/predict', {
            method: 'POST',
            body: JSON.stringify({ message: messageText }),
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json'
            },
        })
            .then(r => r.json())
            .then(r => {
                this.wrapText(r.response)
            }).catch((error) => {
                this.wrapText(error.message)
            });
    }
}

const chatbox = new Chatbox();
chatbox.display();
