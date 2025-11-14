
// Step 2 Photo Engine (basic working version)

function initPhotoEngine() {
  // Ensure storage exists
  if (!localStorage.getItem('inventoryPhotos')) {
    localStorage.setItem('inventoryPhotos', JSON.stringify({}));
  }
}

// Capture photo for specific item
function addPhoto(prop, room, item) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.capture = 'environment';

  input.onchange = () => {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      savePhoto(prop, room, item, dataUrl);
      displayThumbnails(prop, room, item);
    };
    reader.readAsDataURL(file);
  };

  input.click();
}

// Save to localStorage
function savePhoto(prop, room, item, dataUrl) {
  let db = JSON.parse(localStorage.getItem('inventoryPhotos'));
  if (!db[prop]) db[prop] = {};
  if (!db[prop][room]) db[prop][room] = {};
  if (!db[prop][room][item]) db[prop][room][item] = [];

  const timestamp = new Date().toISOString();
  const ref = `${room}-${item}-${db[prop][room][item].length+1}`;

  db[prop][room][item].push({
    ref: ref,
    timestamp: timestamp,
    image: dataUrl
  });

  localStorage.setItem('inventoryPhotos', JSON.stringify(db));
}

// Display thumbnails under item row
function displayThumbnails(prop, room, item) {
  const container = document.getElementById(`thumbs-${item}`);
  if (!container) return;
  container.innerHTML = '';

  const db = JSON.parse(localStorage.getItem('inventoryPhotos'));
  const list = db[prop]?.[room]?.[item] || [];

  list.forEach(photo => {
    const img = document.createElement('img');
    img.src = photo.image;
    img.className = 'thumb';
    container.appendChild(img);
  });
}

initPhotoEngine();
