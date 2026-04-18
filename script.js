const map = new maplibregl.Map({
    style: 'https://tiles.openfreemap.org/styles/liberty',
    center: [13.388, 52.517],
    zoom: 9.5,
    container: 'map',
    cooperativeGestures: true
});

let currentMarker = null;

map.on('click', (e) => {
    const { lng, lat } = e.lngLat;

    if (currentMarker) currentMarker.remove();
    currentMarker = new maplibregl.Marker({
        color: "#ff0000"
    })
    .setLngLat([lng, lat])
    .addTo(map)

    const addressInput = document.getElementById('addressInput');
    addressInput.value = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
})

map.addControl(new maplibregl.NavigationControl(), 'top-right')

document.getElementById('searchInput').addEventListener("keydown", function (event){
    if (event.key === 'Enter') {
        event.preventDefault();
        searchAddress();
    }
})

async function searchAddress() {
    const query = document.getElementById('searchInput').value;
    if (!query) return;

    // Use Nominatim endpoint, add format=json, and fix template literal syntax
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=10`;
    
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();

        if (data && data.length > 0) {
            // API returns 'lat' and 'lon' (as strings)
            const place = pickBestResult(data, query)
            const latNum = parseFloat(place.lat);
            const lonNum = parseFloat(place.lon);

            map.flyTo({
                center: [lonNum, latNum], // Note: Leaflet uses [lat, lon], Mapbox/GL uses [lon, lat]
                zoom: 14,
                essential: true
            });

            if (typeof updateMarker === "function") {
                updateMarker(lonNum, latNum);
            }
        } else {
            alert("Location not found.");
        }
    } catch (error) {
        console.error("There is an error: ", error);
    }
}

function pickBestResult(results, query) {
    const q = query.toLowerCase();

    return results
        .map(r => {
            let score = 0;
            if (r.display_name.toLowerCase().includes(q)) {
                score += 50;
            }

            if (['stadium', 'attraction', 'building', 'road'].includes(r.type)) {
                score += 30;
            }

            if (['city', 'state', 'country'].includes(r.type)){
                score -= 20
            }

            score += (r.importance || 0) * 10;
            return {...r, score };
        })
        .sort((a, b) => b.score - a.score)[0];
}

function updateMarker(lng, lat) {
    if (currentMarker) currentMarker.remove();
    currentMarker = new maplibregl.Marker({ color: "#ff0000"})
        .setLngLat([lng, lat])
        .addTo(map);
}

function openDialog() {
    document.getElementById('addressDialog').showModal();
}

function closeDialog() {
    document.getElementById('addressDialog').close();
}

function submitAddress() {
    const address = document.getElementById('addressInput').value;
    console.log("User entered:", address);
    document.getElementById('addressDialog').close()
}
