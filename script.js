document.addEventListener('DOMContentLoaded', () => {
    const splashScreen = document.getElementById('splashScreen');
    const chatContainer = document.querySelector('.chat-container');
    const userInput = document.getElementById('userInput');
    const submitBtn = document.getElementById('submitBtn');
    const chatMessages = document.getElementById('chatMessages');

    const API_KEY = '635afbbf01a64f2897e958187c411036';
    const API_ENDPOINT = 'https://api.aimlapi.com/v1/chat/completions';

    const SESSION_STORAGE_KEY = 'zenithChatHistory';

    let currentSessionMessages = loadSession();

    setTimeout(() => {
        splashScreen.style.display = 'none';
        chatContainer.style.opacity = 1;
        
        // Paparkan semula mesej dari sesi yang disimpan, jika ada
        if (currentSessionMessages.length > 2) { 
            // Paparkan mesej dari sesi yang disimpan
            for (let i = 2; i < currentSessionMessages.length; i++) {
                const message = currentSessionMessages[i];
                addMessageToDOM(message.content, message.role);
            }
        }
    }, 3000);

    function loadSession() {
        const storedSession = localStorage.getItem(SESSION_STORAGE_KEY);
        if (storedSession) {
            return JSON.parse(storedSession);
        }
        // Riwayat sesi awal yang sudah termasuk instruksi
        return [
            {
                role: 'user',
                content: 'Nama anda ialah Zenith AI. Anda ialah model bahasa besar yang dibangunkan oleh Aqil Iman, seorang pelajar di SMASZAL. Sila kesan bahasa yang digunakan oleh pengguna dan balas dalam bahasa yang sama. Jangan sekali-kali nyatakan bahawa anda dilatih oleh Google atau mana-mana syarikat lain.',
            },
            {
                role: 'assistant',
                content: 'Baik, saya faham. Saya akan membalas dalam bahasa yang sama dengan anda. Saya juga boleh berinteraksi dalam Bahasa Melayu. Bagaimana saya boleh bantu anda?',
            },
        ];
    }

    function saveSession() {
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(currentSessionMessages));
    }
    
    // Fungsi clearSession telah dibuang

    // Kod untuk butang Clear Chat telah dibuang

    function addLoadingDots() {
        const loadingDots = document.createElement('div');
        loadingDots.classList.add('loading-dots');
        loadingDots.innerHTML = '<span></span><span></span><span></span>';
        chatMessages.appendChild(loadingDots);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return loadingDots;
    }

    function typeWriterEffect(element, text, speed, callback) {
        let i = 0;
        element.textContent = '';
        function type() {
            if (i < text.length) {
                element.textContent += text.charAt(i);
                i++;
                chatMessages.scrollTop = chatMessages.scrollHeight;
                setTimeout(type, speed);
            } else if (callback) {
                callback();
            }
        }
        type();
    }

    function addMessageToDOM(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', `${sender}-message`, 'fade-in');

        const p = document.createElement('p');
        p.classList.add('message-content');
        messageDiv.appendChild(p);

        chatMessages.appendChild(messageDiv);

        if (sender === 'assistant') {
            const textLength = text.length;
            let typingSpeed;

            if (textLength > 500) {
                typingSpeed = 5;
            } else if (textLength > 200) {
                typingSpeed = 10;
            } else if (textLength > 50) {
                typingSpeed = 25;
            } else {
                typingSpeed = 50;
            }
            
            messageDiv.classList.add('typing');

            typeWriterEffect(p, text.replace(/\*/g, ''), typingSpeed, () => {
                messageDiv.classList.remove('typing');
                
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
            });
        } else {
            p.textContent = text;
        }
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    submitBtn.addEventListener('click', async () => {
        const userMessage = userInput.value.trim();
        if (userMessage === '') {
            return;
        }
        addMessageToDOM(userMessage, 'user');
        
        currentSessionMessages.push({ role: 'user', content: userMessage });
        saveSession();
        
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
                    model: 'google/gemma-3-4b-it',
                    messages: currentSessionMessages,
                    max_tokens: 1000,
                    temperature: 0.7,
                })
            });

            if (!response.ok) {
                if (chatMessages.contains(loadingDots)) {
                    chatMessages.removeChild(loadingDots);
                }
                
                let errorDetails = '';
                try {
                    const errorData = await response.json();
                    errorDetails = errorData.detail || errorData.message || JSON.stringify(errorData);
                } catch (e) {
                    errorDetails = `Gagal memproses respons error dari API: ${e.message}`;
                }

                if (response.status === 401) {
                    addMessageToDOM(`Maaf, ada masalah dengan API key. Sila pastikan kunci anda betul dan belum luput.`, 'assistant');
                } else if (response.status === 404) {
                    addMessageToDOM(`Maaf, model AI tidak dijumpai. Sila periksa semula nama model di dalam kod.`, 'assistant');
                } else if (response.status === 400) {
                    addMessageToDOM(`Maaf, ada masalah dengan permintaan anda (Bad Request). Detail: ${errorDetails}. Sila cuba lagi dengan soalan yang lain.`, 'assistant');
                } else {
                    addMessageToDOM(`Maaf, ada masalah teknikal. Sila cuba lagi nanti. (Status: ${response.status}, Detail: ${errorDetails})`, 'assistant');
                }
                
                console.error(`API Error - Status: ${response.status}`, errorDetails);
                return;
            }

            const data = await response.json();

            if (data && data.choices && data.choices.length > 0 && data.choices[0].message && data.choices[0].message.content) {
                const aiResponseContent = data.choices[0].message.content;

                currentSessionMessages.push({ role: 'assistant', content: aiResponseContent });
                saveSession();
                
                if (chatMessages.contains(loadingDots)) {
                    chatMessages.removeChild(loadingDots);
                }
                
                addMessageToDOM(aiResponseContent, 'assistant');
            } else {
                if (chatMessages.contains(loadingDots)) {
                    chatMessages.removeChild(loadingDots);
                }
                addMessageToDOM('Tidak ada respons yang valid dari AI. Sila cuba lagi.', 'assistant');
                console.warn('Struktur respons tidak sesuai harapan:', data);
            }

        } catch (error) {
            if (chatMessages.contains(loadingDots)) {
                chatMessages.removeChild(loadingDots);
            }
            console.error('Ada masalah saat mengambil data dari AIML API:', error);
            addMessageToDOM(`Maaf, ada masalah teknikal. Sila cuba lagi nanti.`, 'assistant');
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
