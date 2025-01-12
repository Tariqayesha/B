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

// Initialize Chart.js for the gauge
// const tempGauge = document.getElementById('tempGauge');
// Initialize the thermometer element
// const thermometerInner = document.getElementById('thermometer-inner');
// Store references to the charts
let tempChart = null;
let humidityChart = null;

// Function to set up a real-time listener for temperature updates
function setupRealTimeListener() {
    const sensorRefs = [
        { ref: database.ref('sensor'), tempIndex: 0, humidityIndex: 0 },
        { ref: database.ref('sensor2'), tempIndex: 1, humidityIndex: 1 },
        { ref: database.ref('sensor3'), tempIndex: 2, humidityIndex: 2 },
        { ref: database.ref('sensor4'), tempIndex: 3, humidityIndex: 3 }
    ];

    // Display initial last values
    displaySensorLastValue();

    sensorRefs.forEach(sensor => {
        sensor.ref.on('value', snapshot => {
            const data = snapshot.val();
            if (data) {
                const timestamp = new Date().toLocaleString(); // Or use server timestamp
                const temperature = parseFloat(data.temperature);
                const humidity = parseFloat(data.humidity);
                storeSensorLastValue();
                displaySensorLastValue();
                // Update temperature chart with the respective dataset index for each sensor
                // updateChart(tempChart, timestamp, temperature, sensor.tempIndex);
                // Update humidity chart with the respective dataset index for each sensor
                // updateChart(humidityChart, timestamp, humidity, sensor.humidityIndex);
            }
        });
    });
}

    


// Function to update the temperature in all the gauge and thermometer widgets
function updateTemperature(sensorIndex, temp, hum) {
    const tempPercentage = Math.min(Math.max(temp / 100, 0), 1); // Clamp temperature between 0 and 100
    const height = (tempPercentage * 100); // Set the height relative to the percentage
    const humPercentage = Math.min(Math.max(hum / 100, 0), 1); // Clamp humidity between 0 and 100
    const humHeight = (humPercentage * 100);

    // Update the temperature gauge
    // const tempGauge = document.getElementById(`tempGauge${sensorIndex}`);
    const tempGaugeValue = document.getElementById(`temp-gauge-value${sensorIndex}`);
    if (tempGaugeValue) {
        // tempGauge.style.height = `${height}%`;
        tempGaugeValue.textContent = `${temp.toFixed(2)} °C`;
    }

    // Update the humidity gauge
    // const humidityGauge = document.getElementById(`humidityGauge${sensorIndex}`);
    const humidityGaugeValue = document.getElementById(`humidity-gauge-value${sensorIndex}`);
    if ( humidityGaugeValue) {
        // humidityGauge.style.height = `${humHeight}%`;
        humidityGaugeValue.textContent = `${hum.toFixed(2)} %`;
    }

    // Call the function to display the time lapsed
    timeLapsedSinceLastUpdate(sensorIndex);
}
function displaySensorLastValue() {
    const sensorRefs = [
        { sensor: 'sensorLastValue', sensorIndex: 1 },
        { sensor: 'sensorLastValue2', sensorIndex: 2 },
        { sensor: 'sensorLastValue3', sensorIndex: 3 },
        { sensor: 'sensorLastValue4', sensorIndex: 4 }
    ];

    sensorRefs.forEach(ref => {
        const lastValueRef = database.ref(ref.sensor);

        // Retrieve the data from the /sensorLastValue node
        lastValueRef.once('value', (snapshot) => {
            const data = snapshot.val();

            if (data) {
                const temperature = data.temperature;
                const humidity = data.humidity;
                const timestamp = data.timestamp;

                // Update temperature and humidity widgets
                updateTemperature(ref.sensorIndex, temperature, humidity);

                // Check if timestamp exists and update the status
                if (timestamp) {
                    const currentTime = new Date().getTime();
                    const lastSeenTimestamp = new Date(timestamp).getTime();
                    const differenceInMinutes = (currentTime - lastSeenTimestamp) / (1000 * 60);

                    const statusIndicator = document.getElementById(`status-indicator-${ref.sensorIndex}`);

                    if (differenceInMinutes > 5) {
                        statusIndicator.classList.remove('online');
                        statusIndicator.classList.add('offline');
                    } else {
                        statusIndicator.classList.remove('offline');
                        statusIndicator.classList.add('online');
                    }
                } else {
                    console.log(`No timestamp available in /${ref.sensor}`);
                }
            } else {
                console.log(`No data available in /${ref.sensor}`);
            }
        });
    });
}


function storeData(value,value2) {
    const timestamp = Date.now();
    database.ref('dataHistory/' + timestamp).set({
        temperature: value, humidity: value2
    });
}
// Function to retrieve historical data and create a line chart
// Function to retrieve historical data and create a line chart
function retrieveDataAndCreateChart(startDate, endDate) {
    // Clear existing charts
    if (tempChart) {
        tempChart.destroy();
    }
    if (humidityChart) {
        humidityChart.destroy();
    }  

    const dataRefs = [
        database.ref('dataHistory'),
        database.ref('dataHistory2'),
        database.ref('dataHistory3'),
        database.ref('dataHistory4')
    ];

    const promises = dataRefs.map(ref => ref.once('value'));

    Promise.all(promises).then(snapshots => {
        const timestamps = [[], [], [], []]; // Timestamps from each sensor
        const temperatures = [[], [], [], []]; // Temperatures from each sensor
        const humidities = [[], [], [], []]; // Humidities from each sensor

        // Process each snapshot and extract timestamps, temperatures, and humidities
        snapshots.forEach((snapshot, index) => {
            const data = snapshot.val();
            if (data) {
                for (const timestamp in data) {
                    if (data.hasOwnProperty(timestamp)) {
                        const date = new Date(parseInt(timestamp));
                        if (applyDateFilter(date, startDate, endDate)) {
                            timestamps[index].push(parseInt(timestamp));
                            temperatures[index].push(parseFloat(data[timestamp].temperature));
                            humidities[index].push(parseFloat(data[timestamp].humidity));
                        }
                    }
                }
            }
        });

        // Combine timestamps from all sensors
        const combinedTimestamps = Array.from(
            new Set([...timestamps[0], ...timestamps[1], ...timestamps[2], ...timestamps[3]])
        ).sort((a, b) => a - b);

        // Initialize the dataArray with null values
        const combinedTemperatures = Array.from({ length: 4 }, () => Array(combinedTimestamps.length).fill(null));
        const combinedHumidities = Array.from({ length: 4 }, () => Array(combinedTimestamps.length).fill(null));

        // Traverse combined timestamps and fill dataArray
        combinedTimestamps.forEach((timestamp, index) => {
            timestamps.forEach((sensorTimestamps, sensorIndex) => {
                // Find exact or nearest timestamp within 1 minute
                const exactMatchIndex = sensorTimestamps.indexOf(timestamp);
                let closestMatchIndex = exactMatchIndex;
                if (exactMatchIndex === -1) {
                    closestMatchIndex = sensorTimestamps.findIndex(
                        sensorTimestamp => Math.abs(sensorTimestamp - timestamp) <= 60000
                    );
                }

                // If a match is found, store temperature and humidity
                if (closestMatchIndex !== -1) {
                    combinedTemperatures[sensorIndex][index] = temperatures[sensorIndex][closestMatchIndex];
                    combinedHumidities[sensorIndex][index] = humidities[sensorIndex][closestMatchIndex];
                }
            });
        });

        // Convert timestamps to date strings for chart rendering if needed
        const timestampStrings = combinedTimestamps.map(ts => new Date(ts).toLocaleString());

        // Create charts with combined data
        createChart(
            timestampStrings,
            combinedTemperatures[0], combinedHumidities[0],
            combinedTemperatures[1], combinedHumidities[1],
            combinedTemperatures[2], combinedHumidities[2],
            combinedTemperatures[3], combinedHumidities[3]
        );
    });
}

function applyDateFilter(date, startDate, endDate) {
    let dateMatch = true;

    if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        dateMatch = date >= start && date <= end;
    }

    return dateMatch;
}



function createChart(
    timestamps1, 
    temperatures1 = [], humidities1 = [], 
    temperatures2 = [], humidities2 = [], 
    temperatures3 = [], humidities3 = [], 
    temperatures4 = [], humidities4 = []
) {
    const ctxTemp = document.getElementById('myChart').getContext('2d');
    const ctxHumidity = document.getElementById('temp-humidity-chart').getContext('2d');
    
    // Destroy previous charts if they exist
    if (tempChart) {
        tempChart.destroy();
    }
    if (humidityChart) {
        humidityChart.destroy();
    }
    
    // Helper function to create a dataset
    const createDataset = (label, data, color) => ({
        label: label,
        data: data,
        borderColor: color,
        backgroundColor: 'rgba(0, 0, 0, 0)',
        borderWidth: 2,
        fill: true
    });

    // Helper function to format timestamp labels as hh:mm
    const formatTimeLabel = (timestamp) => {
        const [datePart, timePart] = timestamp.split(', ');
        const [hours, minutes] = timePart.split(':');
        
        let [hour, period] = hours.split(' ');
        if (period === 'pm' && hour !== '12') {
            hour = parseInt(hour, 10) + 12;
        } else if (period === 'am' && hour === '12') {
            hour = '00';
        }

        return `${hour.padStart(2, '0')}:${minutes}`;
    };

    // Helper function to format timestamp labels as dd/mm
    const formatDateLabel = (timestamp) => {
        const [datePart] = timestamp.split(', ');
        return datePart;
    };

    // Format timestamps for labels
    const formattedTimestamps = timestamps1.map(formatTimeLabel);

    // Chart data for the temperature chart
    const tempChartData = {
        labels: formattedTimestamps,
        datasets: [
            createDataset('Temperature 1 (°C)', temperatures1, 'rgba(75, 192, 192, 1)'),
            createDataset('Temperature 2 (°C)', temperatures2, 'rgba(255, 99, 132, 1)'),
            createDataset('Temperature 3 (°C)', temperatures3, 'rgba(54, 162, 235, 1)'),
            createDataset('Temperature 4 (°C)', temperatures4, 'rgba(255, 206, 86, 1)')
        ]
    };

    // Create the temperature chart
    tempChart = new Chart(ctxTemp, {
        type: 'line',
        data: tempChartData,
        options: {
            scales: {
                x: {
                    title: {
                        display: false,
                        text: 'Timestamp'
                    },
                    ticks: {
                        autoSkip: true, // Ensure all ticks are shown
                        maxTicksLimit: 10, // Adjust based on your data and space
                        callback: function(value, index, values) {
                            if (index === 0) {
                                return formatDateLabel(timestamps1[0]); // Display dd/mm for first label
                            } else if (index === values.length - 1) {
                                return formatDateLabel(timestamps1[timestamps1.length - 1]); // Display dd/mm for last label
                            } else {
                                return formatTimeLabel(timestamps1[index]); // Display hh:mm for other labels
                            }
                        }
                    }
                },
                y: {
                    title: {
                        display: false,
                        text: 'Temperature (°C)'
                    }
                }
            },
            responsive: true,
            maintainAspectRatio: false,
            elements: {
                line: {
                    tension: 0 // Straight lines
                },
                point: {
                    radius: 0 // No dots or points
                }
            },
            plugins: {
                zoom: {
                    pan: {
                        enabled: true,
                        mode: 'x' // Allow panning on the X-axis
                    },
                    zoom: {
                        mode: 'x', // Enable zooming on the X-axis
                        drag: {
                            enabled: true, // Enable drag-to-zoom functionality
                            backgroundColor: 'rgba(0, 0, 0, 0.1)', // Background color of the drag selection
                        },
                        wheel: {
                            enabled: false, // Disable zooming with the mouse wheel
                        },
                        pinch: {
                            enabled: false, // Disable pinch zooming
                        },
                    }
                }
            }
        }
    });

    // Chart data for the humidity chart
    const humidityChartData = {
        labels: formattedTimestamps,
        datasets: [
            createDataset('Humidity 1 (%)', humidities1, 'rgba(75, 192, 192, 1)'),
            createDataset('Humidity 2 (%)', humidities2, 'rgba(255, 99, 132, 1)'),
            createDataset('Humidity 3 (%)', humidities3, 'rgba(54, 162, 235, 1)'),
            createDataset('Humidity 4 (%)', humidities4, 'rgba(255, 206, 86, 1)')
        ]
    };

    // Create the humidity chart
    humidityChart = new Chart(ctxHumidity, {
        type: 'line',
        data: humidityChartData,
        options: {
            scales: {
                x: {
                    title: {
                        display: false,
                        text: 'Timestamp'
                    },
                    ticks: {
                        autoSkip: true, // Ensure all ticks are shown
                        maxTicksLimit: 10, // Adjust based on your data and space
                        callback: function(value, index, values) {
                            if (index === 0) {
                                return formatDateLabel(timestamps1[0]); // Display dd/mm for first label
                            } else if (index === values.length - 1) {
                                return formatDateLabel(timestamps1[timestamps1.length - 1]); // Display dd/mm for last label
                            } else {
                                return formatTimeLabel(timestamps1[index]); // Display hh:mm for other labels
                            }
                        }
                    }
                },
                y: {
                    title: {
                        display: false,
                        text: 'Humidity (%)'
                    }
                }
            },
            responsive: true,
            maintainAspectRatio: false,
            elements: {
                line: {
                    tension: 0 // Straight lines
                },
                point: {
                    radius: 0 // No dots or points
                }
            },
            plugins: {
                zoom: {
                    pan: {
                        enabled: true,
                        mode: 'x' // Allow panning on the X-axis
                    },
                    zoom: {
                        mode: 'x', // Enable zooming on the X-axis
                        drag: {
                            enabled: true, // Enable drag-to-zoom functionality
                            backgroundColor: 'rgba(0, 0, 0, 0.1)', // Background color of the drag selection
                        },
                        wheel: {
                            enabled: false, // Disable zooming with the mouse wheel
                        },
                        pinch: {
                            enabled: false, // Disable pinch zooming
                        },
                    }
                }
            }
        }
    });
}




function timeLapsedSinceLastUpdate(index) {
    // Reference the appropriate node based on the index passed
    const lastValueRef = database.ref(`sensorLastValue${index !== 1 ? index : ''}/timestamp`);

    // Get the timestamp from /sensorLastValue[index]
    lastValueRef.once('value').then((snapshot) => {
        const lastTimestamp = snapshot.val();

        // Check if a timestamp is available
        if (lastTimestamp) {
            // Calculate the time difference
            const now = Date.now();
            const timeDifference = now - lastTimestamp;

            // Convert the time difference into a readable format
            const seconds = Math.floor((timeDifference / 1000) % 60);
            const minutes = Math.floor((timeDifference / (1000 * 60)) % 60);
            const hours = Math.floor((timeDifference / (1000 * 60 * 60)) % 24);
            const days = Math.floor(timeDifference / (1000 * 60 * 60 * 24));

            // Construct the time lapsed string
            let timeLapsed = '';
            if (days > 0) timeLapsed += `${days} days `;
            else if (hours > 0) timeLapsed += `${hours} hours `;
            else if (minutes > 0) timeLapsed += `${minutes} minutes `;
            else timeLapsed += `${seconds} seconds`;
            timeLapsed += ' ago';

            // Display the time lapsed in the appropriate element
            document.getElementById(`time-lapsed${index !== 1 ? index : ''}`).textContent = `Last update: ${timeLapsed}`;
        } else {
            // No timestamp available
            document.getElementById(`time-lapsed${index !== 1 ? index : ''}`).textContent = 'No updates available';
        }
    }).catch((error) => {
        // Handle any errors
        console.error('Error fetching timestamp:', error);
        document.getElementById(`time-lapsed${index !== 1 ? index : ''}`).textContent = 'Error fetching update time';
    });
}

function storeSensorLastValue() {
    const sensorRefs = [
        { sensor: 'sensor', lastValue: 'sensorLastValue', history: 'dataHistory' },
        { sensor: 'sensor2', lastValue: 'sensorLastValue2', history: 'dataHistory2' },
        { sensor: 'sensor3', lastValue: 'sensorLastValue3', history: 'dataHistory3' },
        { sensor: 'sensor4', lastValue: 'sensorLastValue4', history: 'dataHistory4' }
    ];

    sensorRefs.forEach(refs => {
        const sensorRef = database.ref(refs.sensor);

        // Retrieve the current data from the /sensor node
        sensorRef.once('value').then((snapshot) => {
            const data = snapshot.val();

            if (data) {
                // Reference for /sensorLastValue node
                const lastValueRef = database.ref(refs.lastValue);

                // Store temperature and humidity first
                return lastValueRef.set({
                    temperature: data.temperature,
                    humidity: data.humidity,
                    timestamp: firebase.database.ServerValue.TIMESTAMP // Set timestamp here
                }).then(() => {
                    // Store the data in /dataHistory with the current timestamp
                    const dataHistoryRef = database.ref(refs.history).child(Date.now().toString());
                    return dataHistoryRef.set({
                        temperature: data.temperature,
                        humidity: data.humidity
                    });
                }).then(() => {
                    // Clear and remove the /sensor node
                    return sensorRef.remove();
                }).then(() => {
                    console.log(`Data stored in /${refs.history}, /${refs.lastValue}, and /${refs.sensor} node cleared.`);
                });
            } else {
                console.log(`No data found in /${refs.sensor} node.`);
            }
        }).catch((error) => {
            console.error(`Error processing data from /${refs.sensor}:`, error);
        });
    });
}


// Initialize Firebase and set up listeners
document.addEventListener('DOMContentLoaded', function () {
    const tempRangeSelect = document.getElementById('temp-range');
    const customDateRange = document.getElementById('custom-date-range');
    const button1 = document.getElementById('fetch-data');
    customDateRange.style.display = 'none';

    // Function to toggle the custom date range input visibility
    const toggleCustomDateInputs = () => {
        if (tempRangeSelect.value === 'custom') {
            customDateRange.style.display = 'flex';
        } else {
            customDateRange.style.display = 'none';
            // If not custom, update the charts immediately based on selected range
            updateChartBasedOnTempRange();
        }
    };

    // Function to update the charts based on the selected temperature range
    const updateChartBasedOnTempRange = () => {
        const tempRange = tempRangeSelect.value;
        let startDate, endDate;

        // Set startDate and endDate based on selected range
        const now = new Date();
        switch (tempRange) {
            case 'all-time':
                startDate = null;
                endDate = null;
                break;
            case '1-hour':
                startDate = new Date(now.getTime() - (1 * 60 * 60 * 1000));
                endDate = now;
                break;
            case '6-hours':
                startDate = new Date(now.getTime() - (6 * 60 * 60 * 1000));
                endDate = now;
                break;
            case '12-hours':
                startDate = new Date(now.getTime() - (12 * 60 * 60 * 1000));
                endDate = now;
                break;
            case '1-day':
                startDate = new Date(now.getTime() - (24 * 60 * 60 * 1000));
                endDate = now;
                break;
            case '1-week':
                startDate = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
                endDate = now;
                break;
            case '1-month':
                startDate = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
                endDate = now;
                break;
            case '6-months':
                startDate = new Date(now.getTime() - (6 * 30 * 24 * 60 * 60 * 1000));
                endDate = now;
                break;
            case 'last-year':
                startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
                endDate = now;
                break;
            default:
                startDate = null;
                endDate = null;
                break;
        }

        const ctxTemp = document.getElementById('myChart').getContext('2d');
        const ctxHumidity = document.getElementById('temp-humidity-chart').getContext('2d');
        
        // Destroy previous charts if they exist
        if (tempChart) {
            tempChart.destroy();
        }
        if (humidityChart) {
            humidityChart.destroy();
        }  

        // Call the function to retrieve data and create the charts
        retrieveDataAndCreateChart(startDate, endDate);
    };
    const updateChartBasedOnTempRange1 = () => { // Get the start and end dates from the input fields
        const startDate = document.getElementById('start-date').value;
        const endDate = document.getElementById('end-date').value;
    
        // Check if both dates are selected
        if (!startDate || !endDate) {
            alert('Please select both a start date and an end date.');
            return;
        }
    
        // Convert dates to timestamps
        const startTimestamp = new Date(startDate).getTime();
        const endTimestamp = new Date(endDate).getTime();
    
        if (startTimestamp > endTimestamp) {
            alert('The start date cannot be after the end date.');
            return;
        }
    
        // Call your data retrieval function with the start and end timestamps
        retrieveDataAndCreateChart(startTimestamp, endTimestamp);


    };

    // Event listener for the temperature range selection change
    tempRangeSelect.addEventListener('change', toggleCustomDateInputs);
    button1.addEventListener('click', updateChartBasedOnTempRange1);
});

setupRealTimeListener();
retrieveDataAndCreateChart(0,0);
setInterval(displaySensorLastValue, 60000);
