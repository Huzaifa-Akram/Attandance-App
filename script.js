// Global variables
let recognition;
let isRecording = false;
let attendanceData = "";
let rollNumbers = [];
let specialStudentsList = [];

// Initialize the application
document.addEventListener("DOMContentLoaded", function () {
  initializeApp();
});

function initializeApp() {
  // Set today's date by default
  document.getElementById("classDate").value = new Date()
    .toISOString()
    .split("T")[0];

  // Initialize Speech Recognition
  initializeSpeechRecognition();

  // Add event listeners
  addEventListeners();
}

function initializeSpeechRecognition() {
  if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = function (event) {
      let finalTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }

      if (finalTranscript) {
        processVoiceInput(finalTranscript);
      }
    };

    recognition.onerror = function (event) {
      const voiceStatus = document.getElementById("voiceStatus");
      if (voiceStatus) {
        voiceStatus.innerHTML =
          '<span class="error">Error: ' + event.error + "</span>";
      }
      stopRecording();
    };

    recognition.onend = function () {
      stopRecording();
    };
  }
}

function addEventListeners() {
  // Voice button click handler
  const voiceBtn = document.getElementById("voiceBtn");
  if (voiceBtn) {
    voiceBtn.addEventListener("click", toggleVoiceRecording);
  }

  // Generate attendance button
  const generateBtn = document.querySelector(".btn");
  if (generateBtn && generateBtn.onclick === null) {
    generateBtn.addEventListener("click", generateAttendance);
  }

  // Copy button click handler
  const copyBtn = document.getElementById("copyBtn");
  if (copyBtn) {
    copyBtn.addEventListener("click", copyAttendanceData);
  }
}

function toggleVoiceRecording() {
  // If running inside Kodular app, send message to Kodular
  if (window.AppInventor) {
    window.AppInventor.setWebViewString("startVoice");
  } else {
    // If still on normal Chrome browser, fallback to old method
    if (!recognition) {
      alert("Speech recognition not supported in this browser.");
      return;
    }
    if (isRecording) {
      recognition.stop();
      stopRecording();
    } else {
      recognition.start();
      startRecording();
    }
  }
}

function processVoiceInput(transcript) {
  const lowerTranscript = transcript.toLowerCase();
  let processed = false;
  let statusMessage = "";

  // Check for section
  if (lowerTranscript.includes("section")) {
    const sectionMatch = transcript.match(
      /section\s+(.+?)(?:\s+course|\s+instructor|\s+room|\s+teacher|$)/i
    );
    if (sectionMatch) {
      const sectionInput = document.getElementById("sectionName");
      if (sectionInput) {
        sectionInput.value = sectionMatch[1].trim();
        statusMessage += "Section set to: " + sectionMatch[1].trim() + "<br>";
        processed = true;
      }
    }
  }

  // Check for course
  if (lowerTranscript.includes("course")) {
    const courseMatch = transcript.match(
      /course\s+(.+?)(?:\s+section|\s+instructor|\s+room|\s+teacher|$)/i
    );
    if (courseMatch) {
      const courseInput = document.getElementById("courseName");
      if (courseInput) {
        courseInput.value = courseMatch[1].trim();
        statusMessage += "Course set to: " + courseMatch[1].trim() + "<br>";
        processed = true;
      }
    }
  }

  // Check for instructor/teacher
  if (
    lowerTranscript.includes("instructor") ||
    lowerTranscript.includes("teacher")
  ) {
    const instructorMatch = transcript.match(
      /(?:instructor|teacher)\s+(.+?)(?:\s+section|\s+course|\s+room|$)/i
    );
    if (instructorMatch) {
      const instructorInput = document.getElementById("instructorName");
      if (instructorInput) {
        instructorInput.value = instructorMatch[1].trim();
        statusMessage +=
          "Instructor set to: " + instructorMatch[1].trim() + "<br>";
        processed = true;
      }
    }
  }

  // Check for room
  if (lowerTranscript.includes("room")) {
    const roomMatch = transcript.match(
      /room\s+(?:number\s+)?(.+?)(?:\s+section|\s+course|\s+instructor|\s+teacher|$)/i
    );
    if (roomMatch) {
      const roomInput = document.getElementById("roomNumber");
      if (roomInput) {
        roomInput.value = roomMatch[1].trim();
        statusMessage += "Room set to: " + roomMatch[1].trim() + "<br>";
        processed = true;
      }
    }
  }

  // Check for starting time
  if (
    lowerTranscript.includes("starting time") ||
    lowerTranscript.includes("start time")
  ) {
    const timeMatch = transcript.match(
      /(?:starting|start)\s+time\s+(\d{1,2}):?(\d{2})?/i
    );
    if (timeMatch) {
      const hours = timeMatch[1].padStart(2, "0");
      const minutes = timeMatch[2] || "00";
      const startTimeInput = document.getElementById("startTime");
      if (startTimeInput) {
        startTimeInput.value = `${hours}:${minutes}`;
        statusMessage += "Start time set to: " + `${hours}:${minutes}` + "<br>";
        processed = true;
      }
    }
  }

  // Check for ending time
  if (
    lowerTranscript.includes("ending time") ||
    lowerTranscript.includes("end time")
  ) {
    const timeMatch = transcript.match(
      /(?:ending|end)\s+time\s+(\d{1,2}):?(\d{2})?/i
    );
    if (timeMatch) {
      const hours = timeMatch[1].padStart(2, "0");
      const minutes = timeMatch[2] || "00";
      const endTimeInput = document.getElementById("endTime");
      if (endTimeInput) {
        endTimeInput.value = `${hours}:${minutes}`;
        statusMessage += "End time set to: " + `${hours}:${minutes}` + "<br>";
        processed = true;
      }
    }
  }

  // If no command was recognized, treat as roll numbers
  if (!processed) {
    const numbers = transcript.match(/\d+/g);
    if (numbers) {
      const rollNumberInput = document.getElementById("rollNumberInput");
      if (rollNumberInput) {
        const currentValue = rollNumberInput.value;
        const separator = currentValue ? ", " : "";
        rollNumberInput.value += separator + numbers.join(", ");
        statusMessage = "Added roll numbers: " + numbers.join(", ");
      }
    }
  }

  // Update status
  if (statusMessage) {
    const voiceStatus = document.getElementById("voiceStatus");
    if (voiceStatus) {
      voiceStatus.innerHTML = '<span class="info">' + statusMessage + "</span>";
    }
  }
}

function startRecording() {
  isRecording = true;
  const btn = document.getElementById("voiceBtn");
  const voiceText = document.getElementById("voiceText");
  const voiceStatus = document.getElementById("voiceStatus");

  if (btn) btn.classList.add("recording");
  if (voiceText) voiceText.textContent = "Stop Recording";
  if (voiceStatus) {
    voiceStatus.innerHTML =
      '<span class="success">Listening... Speak commands or roll numbers</span>';
  }
}

function stopRecording() {
  isRecording = false;
  const btn = document.getElementById("voiceBtn");
  const voiceText = document.getElementById("voiceText");

  if (btn) btn.classList.remove("recording");
  if (voiceText) voiceText.textContent = "Start Voice Input";
}

function generateAttendance() {
  // Get input values
  const section = document.getElementById("sectionName")?.value || "Section";
  const course = document.getElementById("courseName")?.value || "Course";
  const instructor =
    document.getElementById("instructorName")?.value || "Instructor";
  const room = document.getElementById("roomNumber")?.value || "Room";
  const date = document.getElementById("classDate")?.value;
  const startTime = document.getElementById("startTime")?.value;
  const endTime = document.getElementById("endTime")?.value;
  const prefix = document.getElementById("rollPrefix")?.value || "";
  const rollInput = document.getElementById("rollNumberInput")?.value;
  const specialInput = document.getElementById("specialStudents")?.value;

  if (!rollInput && !specialInput) {
    alert("Please enter roll numbers");
    return;
  }

  // Parse regular roll numbers
  rollNumbers = [];
  if (rollInput) {
    const numbers = rollInput.match(/\d+/g);
    if (numbers) {
      // Convert to numbers, remove duplicates, and sort
      const uniqueNumbers = [...new Set(numbers.map((n) => parseInt(n)))];
      rollNumbers = uniqueNumbers.sort((a, b) => a - b);
    }
  }

  // Parse different batch code students
  specialStudentsList = [];
  if (specialInput) {
    const lines = specialInput.trim().split("\n");
    specialStudentsList = lines
      .filter((line) => line.trim())
      .map((line) => line.trim());
  }

  // Format date
  const dateObj = new Date(date);
  const formattedDate = dateObj.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  // Format time
  let timeString = "";
  if (startTime && endTime) {
    const formatTime = (time) => {
      const [hours, minutes] = time.split(":");
      const h = parseInt(hours);
      const ampm = h >= 12 ? "PM" : "AM";
      const displayHour = h > 12 ? h - 12 : h === 0 ? 12 : h;
      return `${displayHour}:${minutes} ${ampm}`;
    };
    timeString = `Time: ${formatTime(startTime)} to ${formatTime(endTime)}`;
  }

  // Calculate total
  const totalStudents = rollNumbers.length + specialStudentsList.length;

  // Build attendance output
  attendanceData = `${section}\n`;
  attendanceData += `Course: ${course}\n`;
  attendanceData += `Instructor: ${instructor}\n`;
  attendanceData += `Room: ${room}\n`;
  attendanceData += `Date: ${formattedDate}\n`;
  if (timeString) attendanceData += `${timeString}\n`;
  attendanceData += `\nTotal Present: ${totalStudents}\n\n`;
  attendanceData += `Attendance List:\n`;

  // Add regular students with formatted roll numbers
  rollNumbers.forEach((num) => {
    const formattedNum = String(num).padStart(3, "0");
    attendanceData += `${prefix}${formattedNum}\n`;
  });

  // Add different batch code students at the end
  if (specialStudentsList.length > 0) {
    attendanceData += `\nDifferent Batch Code Students:\n`;
    specialStudentsList.forEach((student) => {
      attendanceData += `${student}\n`;
    });
  }

  // Update UI
  updatePreviewAndStats(totalStudents, rollInput);
}

function updatePreviewAndStats(totalStudents, rollInput) {
  const preview = document.getElementById("preview");
  const exportButtons = document.getElementById("exportButtons");
  const voiceStatus = document.getElementById("voiceStatus");
  const copyBtn = document.getElementById("copyBtn");

  if (preview) {
    preview.textContent = attendanceData;
    preview.classList.add("show");

    // Show copy button when preview is visible
    if (copyBtn) {
      copyBtn.style.display = "inline-flex";
    }
  }

  if (exportButtons) exportButtons.style.display = "flex";

  // Show success message if duplicates were removed
  const originalNumbers = rollInput ? rollInput.match(/\d+/g) : [];
  if (originalNumbers && originalNumbers.length > rollNumbers.length) {
    const duplicatesRemoved = originalNumbers.length - rollNumbers.length;
    if (voiceStatus) {
      voiceStatus.innerHTML = `<span class="success">Attendance generated! (${duplicatesRemoved} duplicate(s) removed)</span>`;
    }
  }
}

function copyAttendanceData() {
  if (!attendanceData) {
    alert("Please generate attendance first");
    return;
  }

  const copyBtn = document.getElementById("copyBtn");

  navigator.clipboard
    .writeText(attendanceData)
    .then(() => {
      // Show success feedback
      if (copyBtn) {
        const originalText = copyBtn.textContent;
        copyBtn.textContent = "Copied!";
        copyBtn.classList.add("copied");

        setTimeout(() => {
          copyBtn.textContent = originalText;
          copyBtn.classList.remove("copied");
        }, 2000);
      }
    })
    .catch((err) => {
      console.error("Failed to copy: ", err);
      alert("Failed to copy to clipboard");
    });
}

function exportTXT() {
  if (!attendanceData) {
    alert("Please generate attendance first");
    return;
  }

  if (window.AppInventor) {
    // Send the text data to Kodular
    window.AppInventor.setWebViewString("saveTXT::" + attendanceData);
  } else {
    // fallback for browser
    const blob = new Blob([attendanceData], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance_${new Date().toISOString().split("T")[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

function exportPDF() {
  if (!attendanceData) {
    alert("Please generate attendance first");
    return;
  }

  if (typeof window.jspdf === "undefined") {
    alert(
      "PDF export library not loaded. Please refresh the page and try again."
    );
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  // Set professional fonts
  doc.setFont("helvetica");

  // Add header with professional styling
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("ATTENDANCE RECORD", 105, 25, { align: "center" });

  // Add a line under header
  doc.setLineWidth(0.5);
  doc.line(20, 30, 190, 30);

  // Split text into lines
  const lines = attendanceData.split("\n");
  let yPosition = 45;

  // Add content with clean formatting
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");

  for (let i = 0; i < lines.length; i++) {
    if (yPosition > 270) {
      doc.addPage();
      yPosition = 25;
    }

    // Professional formatting
    if (
      lines[i].includes("Total Present:") ||
      lines[i].includes("Attendance List:") ||
      lines[i].includes("Different Batch Code Students:")
    ) {
      doc.setFont("helvetica", "bold");
      doc.text(lines[i], 20, yPosition);
      doc.setFont("helvetica", "normal");
      yPosition += 8;
    } else if (lines[i].trim() !== "") {
      doc.text(lines[i], 20, yPosition);
      yPosition += 6;
    } else {
      yPosition += 3;
    }
  }

  // Add footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Generated on ${new Date().toLocaleDateString()} - Page ${i} of ${pageCount}`,
      105,
      285,
      { align: "center" }
    );
  }

  doc.save(`attendance_${new Date().toISOString().split("T")[0]}.pdf`);
}

function exportImage() {
  if (!attendanceData) {
    alert("Please generate attendance first");
    return;
  }

  if (typeof html2canvas === "undefined") {
    alert(
      "Image export library not loaded. Please refresh the page and try again."
    );
    return;
  }

  // Create a temporary div for rendering
  const tempDiv = document.createElement("div");
  tempDiv.style.position = "absolute";
  tempDiv.style.left = "-9999px";
  tempDiv.style.background = "#ffffff";
  tempDiv.style.color = "#1f2937";
  tempDiv.style.padding = "40px";
  tempDiv.style.fontFamily = "'Arial', sans-serif";
  tempDiv.style.width = "700px";
  tempDiv.style.fontSize = "14px";
  tempDiv.style.lineHeight = "1.6";
  tempDiv.style.border = "1px solid #e5e7eb";

  // Create clean professional content
  const lines = attendanceData.split("\n");
  let html =
    '<div style="background: #ffffff; color: #1f2937; padding: 40px; font-family: Arial, sans-serif;">';

  // Professional header
  html +=
    '<div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #e5e7eb;">';
  html +=
    '<h1 style="color: #1e293b; margin: 0; font-size: 24px; font-weight: bold;">ATTENDANCE RECORD</h1>';
  html +=
    '<p style="margin: 10px 0 0 0; color: #6b7280; font-size: 12px;">Generated on ' +
    new Date().toLocaleDateString() +
    "</p>";
  html += "</div>";

  html +=
    "<div style=\"font-family: 'Courier New', monospace; font-size: 12px; line-height: 1.8;\">";

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("Total Present:")) {
      html +=
        '<div style="background: #f3f4f6; padding: 12px; margin: 15px 0; border-radius: 6px; font-weight: bold; text-align: center; color: #1e293b;">' +
        lines[i] +
        "</div>";
    } else if (
      lines[i].includes("Attendance List:") ||
      lines[i].includes("Different Batch Code Students:")
    ) {
      html +=
        '<h3 style="color: #1e293b; margin: 20px 0 10px 0; font-size: 14px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">' +
        lines[i] +
        "</h3>";
    } else if (lines[i].match(/^\d+/) || lines[i].includes("-")) {
      html +=
        '<div style="background: #f8fafc; padding: 6px 12px; margin: 2px 0; border-radius: 4px; color: #374151;">' +
        lines[i] +
        "</div>";
    } else if (lines[i].trim() !== "") {
      html +=
        '<div style="color: #4b5563; margin: 4px 0;">' + lines[i] + "</div>";
    }
  }

  html += "</div></div>";
  tempDiv.innerHTML = html;
  document.body.appendChild(tempDiv);

  // Use html2canvas to capture the element
  html2canvas(tempDiv.firstChild, {
    scale: 2,
    backgroundColor: "#ffffff",
    useCORS: true,
  })
    .then((canvas) => {
      // Convert to image and download
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `attendance_${new Date().toISOString().split("T")[0]}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      });

      // Remove temporary div
      document.body.removeChild(tempDiv);
    })
    .catch((error) => {
      console.error("Error generating image:", error);
      alert("Error generating image. Please try again.");
      document.body.removeChild(tempDiv);
    });
}

// Utility functions
function formatTime(time) {
  const [hours, minutes] = time.split(":");
  const h = parseInt(hours);
  const ampm = h >= 12 ? "PM" : "AM";
  const displayHour = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${displayHour}:${minutes} ${ampm}`;
}

function getCurrentDate() {
  return new Date().toISOString().split("T")[0];
}

// Export functions for global access (needed for onclick handlers in HTML)
window.generateAttendance = generateAttendance;
window.exportTXT = exportTXT;
window.exportPDF = exportPDF;
window.exportImage = exportImage;
