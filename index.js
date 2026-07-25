const WORKER_URL = "https://pedocatcherrequest.duckybutt40.workers.dev/";

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("reportForm");
    const fileInput = document.getElementById("evidenceFiles");
    const fileListPreview = document.getElementById("fileListPreview");
    const submitBtn = document.getElementById("submitBtn");
    const spinner = submitBtn.querySelector(".spinner");
    const btnText = submitBtn.querySelector(".btn-text");
    const statusMessage = document.getElementById("statusMessage");
    const terminalFeed = document.getElementById("terminalFeed");

    let selectedFiles = [];

    // Periodic live terminal log generator to make the site feel alive
    const mockLogs = [
        "[NET] Encrypted node heartbeat verified.",
        "[SEC] Scanning payload buffer for integrity...",
        "[SYS] Memory allocation stable at 14.2KB.",
        "[NET] Proxy tunnel handshake acknowledged.",
        "[SEC] Firewall policies nominal."
    ];

    setInterval(() => {
        const randomLog = mockLogs[Math.floor(Math.random() * mockLogs.length)];
        const p = document.createElement("p");
        p.className = "log-entry";
        p.textContent = randomLog;
        terminalFeed.appendChild(p);
        if (terminalFeed.children.length > 6) {
            terminalFeed.removeChild(terminalFeed.firstChild);
        }
        terminalFeed.scrollTop = terminalFeed.scrollHeight;
    }, 4500);

    // File input handling
    fileInput.addEventListener("change", (e) => {
        const files = Array.from(e.target.files);
        files.forEach(file => {
            if (!selectedFiles.some(f => f.name === file.name && f.size === file.size)) {
                selectedFiles.push(file);
            }
        });
        renderFileList();
    });

    function renderFileList() {
        fileListPreview.innerHTML = "";
        selectedFiles.forEach((file, index) => {
            const chip = document.createElement("div");
            chip.className = "file-chip";
            
            const nameSpan = document.createElement("span");
            nameSpan.textContent = `${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
            
            const removeBtn = document.createElement("button");
            removeBtn.type = "button";
            removeBtn.textContent = "✕";
            removeBtn.style.background = "none";
            removeBtn.style.border = "none";
            removeBtn.style.color = "#ff6666";
            removeBtn.style.cursor = "pointer";
            
            removeBtn.addEventListener("click", () => {
                selectedFiles.splice(index, 1);
                renderFileList();
            });

            chip.appendChild(nameSpan);
            chip.appendChild(removeBtn);
            fileListPreview.appendChild(chip);
        });
    }

    // Convert files to base64
    async function convertFilesToBase64(files) {
        return Promise.all(files.map(file => {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve({
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    data: reader.result
                });
                reader.onerror = error => reject(error);
                reader.readAsDataURL(file);
            });
        }));
    }

    // Form Submission
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const targetContact = document.getElementById("targetContact").value.trim();
        const details = document.getElementById("details").value.trim();

        if (!targetContact || !details) {
            showStatus("ERR: Required fields missing.", "error");
            return;
        }

        setLoading(true);
        hideStatus();

        try {
            const encodedFiles = await convertFilesToBase64(selectedFiles);

            const payload = {
                targetContact: targetContact,
                details: details,
                evidence: encodedFiles.length > 0 ? JSON.stringify(encodedFiles) : "None provided"
            };

            const response = await fetch(WORKER_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (response.ok && result.success) {
                showStatus("SUCCESS: Payload safely dispatched to endpoint.", "success");
                form.reset();
                selectedFiles = [];
                fileListPreview.innerHTML = "";
            } else {
                throw new Error(result.error || "Transmission rejected by node.");
            }
        } catch (err) {
            showStatus("ERR_DISPATCH: " + err.message, "error");
        } finally {
            setLoading(false);
        }
    });

    function setLoading(isLoading) {
        submitBtn.disabled = isLoading;
        if (isLoading) {
            btnText.textContent = "Transmitting Packet...";
            spinner.classList.remove("hidden");
        } else {
            btnText.textContent = "Execute Secure Transmission";
            spinner.classList.add("hidden");
        }
    }

    function showStatus(text, type) {
        statusMessage.textContent = text;
        statusMessage.className = `status-msg ${type}`;
        statusMessage.classList.remove("hidden");
    }

    function hideStatus() {
        statusMessage.classList.add("hidden");
    }
});
