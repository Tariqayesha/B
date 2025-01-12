// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDzUSWd6yUbUSIxvVt5BGyIpIGiF3SvlGE",
    authDomain: "website-eedd4.firebaseapp.com",
    databaseURL: "https://website-eedd4-default-rtdb.firebaseio.com",
    projectId: "website-eedd4",
    storageBucket: "website-eedd4.appspot.com",
    messagingSenderId: "486493986376",
    appId: "1:486493986376:web:a989fb48a41ed3a966827d"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Reference to Firebase Realtime Database
const database = firebase.database();

document.addEventListener('DOMContentLoaded', () => {
    // Function to update the widget data
    function updateWidgets(data) {
        // Assuming data is an array of objects with temperature and humidity properties
        const widgets = document.querySelectorAll('.card');

        widgets.forEach((widget, index) => {
            if (data[index]) {
                const tempElement = widget.querySelector('div.icon-value span:nth-of-type(1)');
                const humElement = widget.querySelector('div.icon-value span:nth-of-type(2)');
                const statusElement = widget.querySelector('.status');

                tempElement.textContent = `${data[index].temperature} °C`;
                humElement.textContent = `${data[index].humidity} %`;

                // Update status based on last update time
                const lastSeen = data[index].lastSeen;
                const lastSeenDate = new Date(lastSeen);
                const now = new Date();
                const diffMinutes = Math.floor((now - lastSeenDate) / (1000 * 60));
                
                if (diffMinutes < 5) {
                    statusElement.classList.add('online');
                    statusElement.classList.remove('offline');
                } else {
                    statusElement.classList.add('offline');
                    statusElement.classList.remove('online');
                }
            }
        });
    }

    // Function to fetch data from the server
    function fetchData() {
        // Replace with your API endpoint
        fetch('http://example.com/api/temperature-humidity')
            .then(response => response.json())
            .then(data => {
                updateWidgets(data);
            })
            .catch(error => {
                console.error('Error fetching data:', error);
            });
    }

    // Initial fetch and set up interval for updates
    fetchData();
    setInterval(fetchData, 60000); // Fetch data every minute
});

// Function to initialize charts
function initializeCharts() {
    const ctxTemp = document.getElementById('myChart').getContext('2d');
    const ctxHumidity = document.getElementById('temp-humidity-chart').getContext('2d');
    
    // Initialize temperature chart
    tempChart = new Chart(ctxTemp, {
        type: 'line',
        data: {
            labels: [], // Will be populated dynamically
            datasets: [
                {
                    label: 'Temperature Sensor 1 (°C)',
                    data: [], // Will be populated dynamically
                    borderColor: 'rgba(75, 192, 192, 1)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    fill: true
                },
                // Add more datasets for other sensors
            ]
        },
        options: {
            scales: {
                x: { title: { display: true, text: 'Time' } },
                y: { title: { display: true, text: 'Temperature (°C)' } }
            }
        }
    });

    // Initialize humidity chart
    humidityChart = new Chart(ctxHumidity, {
        type: 'line',
        data: {
            labels: [], // Will be populated dynamically
            datasets: [
                {
                    label: 'Humidity Sensor 1 (%)',
                    data: [], // Will be populated dynamically
                    borderColor: 'rgba(75, 192, 192, 1)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    fill: true
                },
                // Add more datasets for other sensors
            ]
        },
        options: {
            scales: {
                x: { title: { display: true, text: 'Time' } },
                y: { title: { display: true, text: 'Humidity (%)' } }
            }
        }
    });
}

// Call the initializeCharts function to set up the charts
initializeCharts();
function setupRealTimeListener() {
    const sensorRefs = [
        { ref: database.ref('sensor'), tempIndex: 0, humidityIndex: 0 },
        { ref: database.ref('sensor2'), tempIndex: 1, humidityIndex: 1 },
        { ref: database.ref('sensor3'), tempIndex: 2, humidityIndex: 2 },
        { ref: database.ref('sensor4'), tempIndex: 3, humidityIndex: 3 }
    ];

    sensorRefs.forEach(sensor => {
        sensor.ref.on('value', snapshot => {
            const data = snapshot.val();
            if (data) {
                const timestamp = new Date().toLocaleString();
                const temperature = parseFloat(data.temperature);
                const humidity = parseFloat(data.humidity);

                // Update charts with new data
                updateChart(tempChart, timestamp, temperature, sensor.tempIndex);
                updateChart(humidityChart, timestamp, humidity, sensor.humidityIndex);
            }
        });
    });
}

// Function to update charts
function updateChart(chart, timestamp, value, datasetIndex) {
    if (chart) {
        // Update labels and datasets
        chart.data.labels.push(timestamp);
        chart.data.datasets[datasetIndex].data.push(value);

        // Keep the chart data within a certain length if necessary
        if (chart.data.labels.length > 20) {
            chart.data.labels.shift();
            chart.data.datasets.forEach(dataset => dataset.data.shift());
        }

        // Update chart
        chart.update();
    }
}
