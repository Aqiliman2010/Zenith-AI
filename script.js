document.addEventListener('DOMContentLoaded', () => {
    const userInput = document.getElementById('userInput');
    const submitBtn = document.getElementById('submitBtn');
    const chatMessages = document.getElementById('chatMessages');

    const API_KEY = '9e505e555ed44612a7cc12097403c75d'; 
    const API_ENDPOINT = 'https://api.aimlapi.com/v1/chat/completions'; 

    // Simpan pesan dalam sesi tunggal
    // **PERBAIKAN: Hapus role: 'system' dan tambahkan instruksi sebagai user message pertama**
    // Ini akan menjadi konteks awal yang tidak ditampilkan ke pengguna secara langsung.
    let currentSessionMessages = [
        { role: 'user', content: 'Sila jawab semua soalan dalam Bahasa Melayu sahaja. Jangan gunakan bahasa lain.' }
    ]; 
    // Tambahan: Tambahkan respons dari AI untuk instruksi awal ini agar konteks seimbang
    // Ini membantu AI memahami bahwa instruksi sudah "diterima"
    currentSessionMessages.push({ role: 'assistant', content: 'Baik, saya faham. Saya akan menjawab dalam Bahasa Melayu sahaja.' });


    // Fungsi untuk menambahkan pesan ke antarmuka chat
    function addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', `${sender}-message`, 'fade-in'); 
        
        const p = document.createElement('p');
        // Membersihkan tanda bintang dari teks respons AI
        p.textContent = (sender === 'ai') ? text.replace(/\*/g, '') : text; 
        
        messageDiv.appendChild(p);

        // Tambahkan tombol copy jika pesan dari AI
        if (sender === 'ai') {
            const copyBtn = document.createElement('button');
            copyBtn.classList.add('copy-btn');
            copyBtn.innerHTML = '<i class="far fa-copy"></i>'; // Ikon copy Font Awesome
            copyBtn.title = 'Salin Pesan';
            copyBtn.addEventListener('click', () => {
                navigator.clipboard.writeText(p.textContent)
                    .then(() => {
                        copyBtn.innerHTML = '<i class="fas fa-check"></i>'; // Ganti ikon jadi ceklis
                        setTimeout(() => {
                            copyBtn.innerHTML = '<i class="far fa-copy"></i>'; // Kembali ke ikon copy
                        }, 2000);
                    })
                    .catch(err => {
                        console.error('Gagal menyalin teks: ', err);
                        alert('Gagal menyalin teks. Sila salin manual.');
                    });
            });
            messageDiv.appendChild(copyBtn);
        }

        chatMessages.appendChild(messageDiv);
        // Pastikan scroll ke bawah setelah animasi fade-in selesai
        messageDiv.addEventListener('animationend', () => {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        });
        // Scroll awal jika animasi belum selesai atau untuk user message
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
            return; // Jangan kirim pesan kosong
        }

        // Tambahkan pesan pengguna ke array sesi saat ini
        currentSessionMessages.push({ role: 'user', content: text });

        addMessage(text, 'user'); // Tampilkan pesan pengguna di UI
        userInput.value = ''; // Kosongkan input
        userInput.style.height = 'auto'; // Reset tinggi textarea

        const loadingDots = addLoadingDots(); // Tampilkan loading dots

        try {
            // Kirim semua pesan dalam sesi untuk konteks
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

            // Hapus loading dots
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
                // Tambahkan respons AI ke array sesi
                currentSessionMessages.push({ role: 'assistant', content: aiResponseContent });
                addMessage(aiResponseContent, 'ai'); // Tampilkan respons AI di UI
            } else {
                addMessage('Tidak ada respons yang valid dari AI.', 'ai');
                console.warn('Struktur respons tidak sesuai harapan:', data);
            }

        } catch (error) {
            // Hapus loading dots jika ada error
            if (chatMessages.contains(loadingDots)) {
                chatMessages.removeChild(loadingDots);
            }
            console.error('Ada masalah saat mengambil data dari AIML API:', error);
            addMessage(`Error: ${error.message}. Cek konsol browser untuk detail lebih lanjut.`, 'ai');
        }
    });

    // Mengizinkan kirim pesan dengan Enter (Shift + Enter untuk baris baru)
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault(); // Mencegah baris baru
            submitBtn.click(); // Memicu klik tombol
        }
    });

    // Menyesuaikan tinggi textarea secara otomatis
    userInput.addEventListener('input', () => {
        userInput.style.height = 'auto'; // Reset height
        userInput.style.height = userInput.scrollHeight + 'px'; // Set to scroll height
    });
});
