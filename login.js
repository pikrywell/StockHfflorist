
const loginForm = document.getElementById("loginForm");

loginForm.addEventListener("submit", async function(event) {

    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const pesan = document.getElementById("pesan");

    pesan.textContent = "Memeriksa akun...";

    const { data, error } =
        await window.supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });

    if (error) {
        pesan.textContent = "Email atau password salah.";
        return;
    }

    window.location.href = "ini main content.html";

});
