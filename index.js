const WORKER_URL = "https://pedocatcherrequest.duckybutt40.workers.dev/";

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("reportForm");
    const fileInput = document.getElementById("evidenceFiles");
    const fileListPreview = document.getElementById("fileListPreview");
    const submitBtn = document.getElementById("submitBtn");
    const spinner = submitBtn.querySelector(".spinner");
    const btnText = submitBtn.querySelector(".btn-text");
    const statusMessage = document.getElementById("statusMessage");

    let selectedFiles = [];

    // Handle interactive file selection and previews
    fileInput.addEventListener("change", (e) => {
        const files = Array.from(e.target.files);
        
        files.forEach(file => {
            // Prevent duplicate file additions based on name & size
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
            removeBtn.style.marginLeft = "10px";
            
            removeBtn.addEventListener("click", () => {
                selectedFiles.splice(index, 1);
                renderFileList();
            });

            chip.appendChild(nameSpan);
            chip.appendChild(removeBtn);
            fileListPreview.appendChild(chip);
        });
    }

    // Helper: Convert uploaded files to base64 for safe JSON transport over worker
    async function convertFilesToBase64(files) {
        const promises = files.map(file => {
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
        });
        return Promise.all(promises);
    }

    // Handle Form Submission & Heavy Lifting
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const targetContact = document.getElementById("targetContact").value.trim();
        const details = document.getElementById("details").value.trim();

        if (!targetContact || !details) {
            showStatus("Please fill out all required fields.", "error");
            return;
        }

        // Lock UI & start loader
        setLoading(true);
        hideStatus();

        try {
            // Heavy lifting: process files into base64 payloads
            const encodedFiles = await convertFilesToBase64(selectedFiles);

            const payload = {
                targetContact: targetContact,
                details: details,
                evidence: encodedFiles.length > 0 ? JSON.stringify(encodedFiles) : "None provided"
            };

            const response = await fetch(WORKER_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (response.ok && result.success) {
                showStatus("✓ Report securely transmitted to monitoring endpoints.", "success");
                form.reset();
                selectedFiles = [];
                fileListPreview.innerHTML = "";
            } else {
                throw new Error(result.error || "Server rejected submission.");
            }
        } catch (err) {
            showStatus("Transmission error: " + err.message, "error");
        } finally {
            setLoading(false);
        }
    });

    function setLoading(isLoading) {
        submitBtn.disabled = isLoading;
        if (isLoading) {
            btnText.textContent = "Processing & Transmitting...";
            spinner.classList.remove("hidden");
        } else {
            btnText.textContent = "Transmit Secure Report";
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
