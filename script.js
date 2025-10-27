// =======================
// 🌍 Initialize Map
// =======================
const map = L.map("map").setView([13.0100751, 76.1205015], 18.0);


// ==== Restrict map to within 10 km of base location ====
const baseLat = 13.0100751;
const baseLng = 76.1205015;

// Approx. 10 km in degrees
const radiusInDegrees = 2/ 111; // ~0.09°

const southWest = L.latLng(baseLat - radiusInDegrees, baseLng - radiusInDegrees);
const northEast = L.latLng(baseLat + radiusInDegrees, baseLng + radiusInDegrees);
const bounds = L.latLngBounds(southWest, northEast);

// Apply restriction
map.setMaxBounds(bounds);
map.on("drag", function () {
  map.panInsideBounds(bounds, { animate: false });
});

// Optional: limit zooming out too far
map.setMinZoom(15);


L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: "© OpenStreetMap contributors",
}).addTo(map);

// =======================
// 🌐 Global Variables
// =======================
let markers = []; // store all markers
let previewMarker = null;
let routeControl = null;
let startPoint = null;
let endPoint = null;

// =======================
// 🔹 Helper Functions
// =======================
function generateId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function escapeHtml(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// =======================
// 📍 Marker Functions
// =======================

// Create permanent marker
function createMarker(lat, lng, name = "Untitled", desc = "") {
  const id = generateId();
  const marker = L.marker([parseFloat(lat), parseFloat(lng)]).addTo(map);

  marker.options.customName = name;
  marker.options.customDesc = desc;

  const popupContent = `
    <div class="popup-content">
      <b>${escapeHtml(name)}</b><br>
      <div>${escapeHtml(desc)}</div>
      <div style="margin-top:8px;">
        <button class="remove-btn" data-id="${id}">🗑 Remove</button>
      </div>
    </div>
  `;

  marker.bindPopup(popupContent);
  marker._cntrId = id;

  markers.push({ id, marker });

  marker.on("click", () => {
    const spotName = marker.options.customName || "Unknown Spot";
    showImagesForSpot(spotName);
  });

  return marker;
}


// =======================
// 🖼️ Image Gallery Feature
// =======================

// Example image database (you can expand this)
const spotImages = {
  "Flag": [
    "./img1.jpg",
    "./img2.jpg",
    "./img3.jpg"
  ],
  "Principal room": [
    "./img4.jpg",
    "./img5.jpg",
    "./img6.jpg",
    "./img7.jpg",
    "./img8.jpg",
    "./img9.jpg",
    "./img10.jpg"
  ],
  "Civil": [
    "./img11.jpg",
    "./img12.jpg",
    "./img13.jpg"
  ],
  "Indoor":["./img16.jpg"],
  "Stadium":["./img14.jpg","./img15.jpg"],
  "CSE":["./img17.jpg","./img18.jpg","./img19.jpg","./img20.jpg","./img21.jpg","./img22.jpg"],
  "Library":["./img23.jpg","./img24.jpg","./img25.jpg"],
  "Girls hostel":["./img28.jpg"],
  "Boys hostel":["./img29.jpg","./img30.jpg"],
  "Auditorium":["./img31.jpg","./img32.jpg"],
  
} 

// Function to show images for a spot
function showImagesForSpot(name) {
  const panel = document.getElementById("imagePanel");
  const title = document.getElementById("panelTitle");
  const list = document.getElementById("imageList");

  // Clear previous
  list.innerHTML = "";
  title.textContent = name + " Photos";

  const imgs = spotImages[name] || [];

  if (imgs.length === 0) {
    list.innerHTML = `<p style="text-align:center; color:#555;">No images available for this spot.</p>`;
  } else {
    imgs.forEach((url) => {
      const img = document.createElement("img");
      img.src = url;
      list.appendChild(img);
    });
  }

  // Show panel
  panel.classList.remove("hidden");
}

// Optional: close panel on outside map click
map.on("click", () => {
  document.getElementById("imagePanel").classList.add("hidden");
});

// Save all markers to localStorage
function saveMarkers() {
  const data = markers.map((obj) => ({
    id: obj.id,
    lat: obj.marker.getLatLng().lat,
    lng: obj.marker.getLatLng().lng,
    name: obj.marker.options.customName || "Untitled",
    desc: obj.marker.options.customDesc || "",
  }));
  localStorage.setItem("campusMarkers", JSON.stringify(data));
}

// Load markers from localStorage
function loadMarkers() {
  const saved = JSON.parse(localStorage.getItem("campusMarkers")) || [];
  saved.forEach((m) => {
    createMarker(m.lat, m.lng, m.name, m.desc);
  });
}

// =======================
// 🖱️ Map Click (Preview Marker)
// =======================
map.on("click", (e) => {
  const lat = e.latlng.lat.toFixed(6);
  const lng = e.latlng.lng.toFixed(6);

  // Fill lat/lng in form fields
  document.getElementById("latitude").value = lat;
  document.getElementById("longitude").value = lng;

  // Remove previous preview marker
  if (previewMarker) {
    map.removeLayer(previewMarker);
  }

  // Add new preview marker
  previewMarker = L.marker([lat, lng]).addTo(map);
  previewMarker
    .bindPopup(`Preview Spot<br>Lat: ${lat}<br>Lng: ${lng}`)
    .openPopup();
});

// =======================
// 🧾 Add Marker from Form
// =======================
document.getElementById("spotForm").addEventListener("submit", (e) => {
  e.preventDefault();

  const name = document.getElementById("spotName").value.trim() || "Untitled";
  const desc = document.getElementById("spotDesc").value.trim() || "";
  const lat = document.getElementById("latitude").value;
  const lng = document.getElementById("longitude").value;

  if (!lat || !lng) {
    alert("Click on the map to select a location first!");
    return;
  }

  if (previewMarker) {
    map.removeLayer(previewMarker);
    previewMarker = null;
  }

  const marker = createMarker(lat, lng, name, desc);
  marker.openPopup();
  saveMarkers(); // persist markers

  document.getElementById("spotForm").reset();
  document.getElementById("latitude").value = "";
  document.getElementById("longitude").value = "";
});

// =======================
// ❌ Remove Marker
// =======================
map.on("popupopen", (e) => {
  const popupNode = e.popup._contentNode;
  const removeBtn = popupNode.querySelector(".remove-btn");
  if (!removeBtn) return;

  removeBtn.addEventListener("click", function () {
    const id = this.getAttribute("data-id");
    const found = markers.find((obj) => obj.id === id);
    if (!found) return;

    map.removeLayer(found.marker);
    markers = markers.filter((obj) => obj.id !== id);
    saveMarkers();
    alert("Marker removed successfully!");
  });
});

map.on("click", () => {
  eventPanel.classList.add("hidden");
});

// =======================
// 🧭 Route Navigation
// =======================
document.getElementById("setStartBtn").addEventListener("click", () => {
  const lat = parseFloat(document.getElementById("latitude").value);
  const lng = parseFloat(document.getElementById("longitude").value);
  if (isNaN(lat) || isNaN(lng)) return alert("Select a start location on map!");
  startPoint = L.latLng(lat, lng);
  alert("✅ Start point set!");
});

document.getElementById("setEndBtn").addEventListener("click", () => {
  const lat = parseFloat(document.getElementById("latitude").value);
  const lng = parseFloat(document.getElementById("longitude").value);
  if (isNaN(lat) || isNaN(lng)) return alert("Select an end location on map!");
  endPoint = L.latLng(lat, lng);
  alert("✅ End point set!");
});

document.getElementById("showRouteBtn").addEventListener("click", () => {
  if (!startPoint || !endPoint)
    return alert("Please set both Start and End points first!");

  if (routeControl) map.removeControl(routeControl);

  routeControl = L.Routing.control({
    waypoints: [startPoint, endPoint],
    routeWhileDragging: false,
    lineOptions: { styles: [{ color: "#00b4d8", weight: 5, opacity: 0.8 }] },
    createMarker: (i, wp, nWps) => {
      const icon = L.icon({
        iconUrl:
          i === 0
            ? "https://cdn-icons-png.flaticon.com/512/684/684908.png"
            : "https://cdn-icons-png.flaticon.com/512/149/149059.png",
        iconSize: [25, 25],
      });
      return L.marker(wp.latLng, { icon });
    },
  }).addTo(map);

  routeControl.on("routesfound", (e) => {
    const route = e.routes[0];
    const bounds = L.latLngBounds(route.waypoints.map((w) => w.latLng));
    map.fitBounds(bounds);
  });
});

// =======================
// 📅 EVENT PANEL LOGIC (with Delete Feature)
// =======================

const eventPanel = document.getElementById("eventPanel");
const eventBtn = document.getElementById("eventBtn");
const eventList = document.getElementById("eventList");
const eventForm = document.getElementById("eventForm");

// Toggle event panel visibility
eventBtn.addEventListener("click", () => {
  eventPanel.classList.toggle("hidden");
});

// Load all events from localStorage
function loadEvents() {
  const events = JSON.parse(localStorage.getItem("campusEvents")) || [];
  eventList.innerHTML = "";

  if (events.length === 0) {
    eventList.innerHTML = `<p style="text-align:center; color:#666;">No ongoing events.</p>`;
    return;
  }

  events.forEach((ev, index) => {
    const card = document.createElement("div");
    card.classList.add("eventCard");

    card.innerHTML = `
      <button class="delete-btn" data-index="${index}">🗑</button>
      <h5>${ev.name}</h5>
      <p>${ev.desc}</p>
    `;

    eventList.appendChild(card);
  });

  // Attach delete button handlers
  const deleteButtons = document.querySelectorAll(".delete-btn");
  deleteButtons.forEach(btn => {
    btn.addEventListener("click", (e) => {
      const idx = e.target.getAttribute("data-index");
      deleteEvent(idx);
    });
  });
}

// Save events back to localStorage
function saveEvents(events) {
  localStorage.setItem("campusEvents", JSON.stringify(events));
}

// Delete specific event
function deleteEvent(index) {
  const events = JSON.parse(localStorage.getItem("campusEvents")) || [];
  events.splice(index, 1);
  saveEvents(events);
  loadEvents();
}

// Add new event
eventForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const name = document.getElementById("eventName").value.trim();
  const desc = document.getElementById("eventDesc").value.trim();

  if (!name || !desc) return alert("Please fill all fields.");

  const events = JSON.parse(localStorage.getItem("campusEvents")) || [];
  events.push({ name, desc });
  saveEvents(events);

  eventForm.reset();
  loadEvents();
});

// Initial load on page start
loadEvents();

// Optional: hide event panel when clicking on the map
map.on("click", () => {
  eventPanel.classList.add("hidden");
});


// =======================
// 💬 CHAT PANEL LOGIC (Array Based)
// =======================

const chatPanel = document.getElementById("chatPanel");
const chatBtn = document.getElementById("chatBtn");
const chatBox = document.getElementById("chatBox");
const chatForm = document.getElementById("chatForm");
const chatInput = document.getElementById("chatInput");

// Toggle chat panel visibility
chatBtn.addEventListener("click", () => {
  chatPanel.classList.toggle("hidden");
});

// === Predefined Q&A Stored in Array ===
const chatData = [
  { question: "hi", answer: "Hello! 👋 How can I assist you today?" },
  { question: "hello", answer: "Hey there! How can I help?" },
  { question: "college name", answer: "Our college is Global Institute of Technology, Tumkur." },
  { question: "library timing", answer: "📚 The library is open from 9 AM to 7 PM, Monday to Saturday." },
  { question: "canteen", answer: "🍔 The canteen near Block B serves snacks and meals from 9 AM to 5 PM." },
  
  { question: "sports", answer: "🏏 We have football, cricket, badminton, and indoor games facilities." },
  { question: "location", answer: "📍 The campus is located at NH-48, Tumkur Road, Karnataka." },
  { question: "admission process", answer: "📝 Admissions are open through CET and management quota." },
  { question: "bye", answer: "Goodbye! 👋 Have a great day ahead!" },
  {question:"how to reach principal office",answer:"From collage enterence take left straight upto the end then take right"}
];

// === Add Message Function ===
function addMessage(text, cls) {
  const msg = document.createElement("div");
  msg.className = `message ${cls}`;
  msg.textContent = text;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// === Save and Load Chat History ===
function saveChat() {
  localStorage.setItem("campusChat", chatBox.innerHTML);
}
function loadChat() {
  const saved = localStorage.getItem("campusChat");
  if (saved) chatBox.innerHTML = saved;
}



// === Chat Submission ===
chatForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const userMsg = chatInput.value.trim();
  if (!userMsg) return;

  addMessage(userMsg, "userMsg");
  chatInput.value = "";

  // Find answer from array
  const lowerMsg = userMsg.toLowerCase();
  const found = chatData.find(item => lowerMsg.includes(item.question));

  setTimeout(() => {
    if (found) {
      addMessage(found.answer, "botMsg");
    } else {
      addMessage("🤔 Sorry, I don't have an answer for that yet!", "botMsg");
    }
    saveChat();
  }, 400);

  saveChat();
});

// === Load chat history when page loads ===
loadChat();

// Optional: close chat when clicking on map
map.on("click", () => {
  chatPanel.classList.add("hidden");
});



// =======================
// 📦 Load Saved Markers on Page Load
// =======================
loadMarkers();
