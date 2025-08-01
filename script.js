document.addEventListener('DOMContentLoaded', () => {
    const userInput = document.getElementById('userInput');
    const submitBtn = document.getElementById('submitBtn');
    const chatMessages = document.getElementById('chatMessages');

    const API_KEY = '9e505e555ed44612a7cc12097403c75d'; 
    const API_ENDPOINT = 'https://api.aimlapi.com/v1/chat/completions'; 

    let currentSessionMessages = [
        { role: 'user', content: 'Nama anda ialah Zenith AI. Anda ialah model bahasa besar yang dibangunkan oleh Aqil Iman, seorang pelajar di SMASZAL. Sila kesan bahasa yang digunakan oleh pengguna dan balas dalam bahasa yang sama. Jangan sekali-kali nyatakan bahawa anda dilatih oleh Google atau mana-mana syarikat lain.' }
    ]; 
    currentSessionMessages.push({ role: 'assistant', content: 'Baik, saya faham. Saya akan membalas dalam bahasa yang sama dengan anda. Saya juga boleh berinteraksi dalam Bahasa Melayu. Bagaimana saya boleh bantu anda?' });
    
    // Fungsi untuk menambahkan pesan ke antarmuka chat
    function addMessage(text, sender) {
        // Hapus initial message sebelum menambahkan pesan baru
        const initialMessage = document.querySelector('.initial-message');
        if (initialMessage) {
            initialMessage.remove();
        }

        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', `${sender}-message`, 'fade-in'); 
        
        const p = document.createElement('p');
        p.textContent = (sender === 'ai') ? text.replace(/\*/g, '') : text; 
        p.classList.add('message-content');
        
        messageDiv.appendChild(p);

        if (sender === 'ai') {
            const copyBtn = document.createElement('button');
            copyBtn.classList.add('copy-btn');
            copyBtn.innerHTML = '<i class="far fa-copy"></i>';
            copyBtn.title = 'Salin Pesan';
            copyBtn.addEventListener('click', () => {
                navigator.clipboard.writeText(p.textContent)
                    .then(() => {
                        copyBtn.innerHTML = '<i class="fas fa-check"></i>';
                        setTimeout(() => {
                            copyBtn.innerHTML = '<i class="far fa-copy"></i>';
                        }, 2000);
                    })
                    .catch(err => {
                        console.error('Gagal menyalin teks: ', err);
                        alert('Gagal menyalin teks. Sila salin manual.');
                    });
            });
            messageDiv.appendChild(copyBtn);

            const feedbackContainer = document.createElement('div');
            feedbackContainer.classList.add('feedback-container');

            const thumbsUpBtn = document.createElement('button');
            thumbsUpBtn.classList.add('feedback-btn');
            thumbsUpBtn.innerHTML = '<i class="far fa-thumbs-up"></i>';
            thumbsUpBtn.title = 'Suka respons ini';
            thumbsUpBtn.addEventListener('click', () => {
                console.log('Feedback positif diterima:', text);
                alert('Terima kasih atas maklum balas anda!');
            });
            
            const thumbsDownBtn = document.createElement('button');
            thumbsDownBtn.classList.add('feedback-btn');
            thumbsDownBtn.innerHTML = '<i class="far fa-thumbs-down"></i>';
            thumbsDownBtn.title = 'Tidak suka respons ini';
            thumbsDownBtn.addEventListener('click', () => {
                console.log('Feedback negatif diterima:', text);
                alert('Terima kasih atas maklum balas anda!');
            });

            feedbackContainer.appendChild(thumbsUpBtn);
            feedbackContainer.appendChild(thumbsDownBtn);
            messageDiv.appendChild(feedbackContainer);
        }

        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Fungsi untuk menambahkan loading dots
    function addLoadingDots() {
        const loadingDiv = document.createElement('div');
        loadingDiv.classList.add('loading-dots');
        loadingDiv.id = 'loadingDots';
        loadingDiv.innerHTML = `
            <span></span>
            <span></span>
            <span></span>
        `;
        chatMessages.appendChild(loadingDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return loadingDiv;
    }

    // Event listener untuk tombol kirim
    submitBtn.addEventListener('click', async () => {
        const text = userInput.value.trim();
        if (text === '') {
            return;
        }

        currentSessionMessages.push({ role: 'user', content: text });
        addMessage(text, 'user');
        userInput.value = '';
        userInput.style.height = 'auto';

        const loadingDots = addLoadingDots();

        try {
            const response = await fetch(API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${API_KEY}` 
                },
                body: JSON.stringify({
                    "model": "google/gemma-3-4b-it", 
                    "messages": currentSessionMessages
                })
            });

            if (chatMessages.contains(loadingDots)) {
                chatMessages.removeChild(loadingDots);
            }

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.detail || errorData.message || 'Unknown error'}`);
            }

            const data = await response.json();
            
            if (data && data.choices && data.choices.length > 0 && data.choices[0].message && data.choices[0].message.content) {
                const aiResponseContent = data.choices[0].message.content;
                currentSessionMessages.push({ role: 'assistant', content: aiResponseContent });
                addMessage(aiResponseContent, 'ai');
            } else {
                addMessage('Tidak ada respons yang valid dari AI. Sila cuba lagi.', 'ai');
                console.warn('Struktur respons tidak sesuai harapan:', data);
            }

        } catch (error) {
            if (chatMessages.contains(loadingDots)) {
                chatMessages.removeChild(loadingDots);
            }
            console.error('Ada masalah saat mengambil data dari AIML API:', error);
            addMessage(`Maaf, ada masalah teknikal. Sila cuba lagi nanti.`, 'ai');
        }
    });

    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            submitBtn.click();
        }
    });

    userInput.addEventListener('input', () => {
        userInput.style.height = 'auto';
        userInput.style.height = userInput.scrollHeight + 'px';
    });
});
