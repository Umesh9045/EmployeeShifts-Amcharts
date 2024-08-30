var chart;
var slotColors = ["#FF0000", "#d50a7ac2", "#00FF00"]; // Red, Blue, Green
var remainingColor = "#f0f0f0";
var currentHighlight = null; // To keep track of the currently highlighted slice
var originalColors = {}; // Object to store original fill and stroke colors by index
var container = document.getElementById('timeSlotsContainer');


document.addEventListener("DOMContentLoaded", function () {

    am4core.ready(function () {
        am4core.useTheme(am4themes_animated);

        chart = am4core.create("myChart", am4charts.PieChart);
        chart.data = generateData();

        var pieSeries = chart.series.push(new am4charts.PieSeries());
        pieSeries.dataFields.value = "value";
        pieSeries.dataFields.category = "category";
        pieSeries.labels.template.fontWeight = "bolder";
        pieSeries.slices.template.strokeOpacity = 1;
        pieSeries.slices.template.propertyFields.stroke = "stroke";
        pieSeries.slices.template.propertyFields.fill = "color";
        pieSeries.slices.template.propertyFields.hidden = "hidden";
        pieSeries.labels.template.text = "{additionalLabel}\u00A0\u00A0{lable}";
        pieSeries.labels.template.fontSize = 10;
        pieSeries.labels.template.wrap = true;
        pieSeries.labels.template.maxWidth = 200;
        pieSeries.labels.template.truncate = true;
        pieSeries.alignLabels = false;
        pieSeries.labels.template.radius = 0.7;
        pieSeries.labels.template.relativeRotation = 90;
        pieSeries.labels.template.disabled = false;

        chart.legend = new am4charts.Legend();
        chart.legend.disabled = true;
    });
});

function readValue(day) {
    container.innerHTML = ''; // Clear existing slots
    showLoadingSpinner();
    const selectElement = document.getElementById('weekdays');
    const selectedValue = selectElement.value;  // Sunday
    loadChartData(selectedValue);
}

function showLoadingSpinner() {
    document.getElementById('weekdaySubmit').style.display = 'none';
    document.getElementById('myChart').style.display = 'none';
    document.getElementById('legend').style.display = 'none';
    document.getElementById('loading-spinner').style.display = 'block';
}

function hideLoadingSpinner() {
    document.getElementById('loading-spinner').style.display = 'none';
    document.getElementById('weekdaySubmit').style.display = 'block';
    document.getElementById('legend').style.display = 'block';
    document.getElementById('myChart').style.display = 'block';
}

function loadChartData(day) {
    fetch('temp.json')
        .then(response => response.json())
        .then(data => {
            var dayData = data.find(d => d.name.toLowerCase() === day);
            if (dayData && dayData.shiftDaysResponse) {
                // Display time slots
                displayTimeSlots(dayData.shiftDaysResponse, dayData.shiftDaysResponse.map((slot, index) => index));

                var shifts = dayData.shiftDaysResponse.map((slot, index) => ({
                    entryTotalMinutes: parseTimeToMinutes(slot.name.split(' to ')[0]),
                    exitTotalMinutes: parseTimeToMinutes(slot.name.split(' to ')[1]),
                    description: slot.description,
                    color: slotColors[index % slotColors.length],
                    index: index
                }));

                // Fetch clock data and update chart
                fetchClockData(shifts);
            } else {
                var shifts = [];
                updateChart(shifts);
                container.innerHTML = 'No Data Found !';
            }
            hideLoadingSpinner();
        })
        .catch(error => {
            console.error('Error loading data:', error);
            hideLoadingSpinner();
        });
}

function fetchClockData(shifts) {
    fetch('clock.json')
        .then(response => response.json())
        .then(clockData => {
            var greenShifts = [];
            var inTime = null;

            clockData.forEach(clock => {
                if (clock.direction === 'In') {
                    inTime = clock.timeStamp;
                }
                else if (clock.direction === 'Out' && inTime) {
                    console.log("greenshift");
                    greenShifts.push({
                        entryTotalMinutes: extractTimeToMinutes(inTime),
                        exitTotalMinutes: extractTimeToMinutes(clock.timeStamp),
                        description: 'Attended Duration',
                        color: 'green',
                        index: shifts.length + greenShifts.length // Append to the end of existing shifts
                    });
                    inTime = null; // Reset inTime after pairing
                }
            });

            shifts = shifts.concat(greenShifts);
            updateChart(shifts);
        })
        .catch(error => {
            console.error('Error loading clock data:', error);
            updateChart(shifts); // Update chart with existing shifts if clock data fails
        });
}

function extractTimeToMinutes(time) {
    // Extract the time part from the string
    let timePart = time.split('T')[1].split(':');

    // Get hours and minutes
    let hours = parseInt(timePart[0]);
    let minutes = parseInt(timePart[1]);

    // Convert hours to minutes and add to minutes
    let totalMinutes = (hours * 60) + minutes;

    return totalMinutes;

}

function parseTimeToMinutes(time) {
    var [hour, minute] = time.split(':').map(Number);
    return hour * 60 + minute;
}

function updateChart(shifts) {
    var totalMinutes = 1440; // Total minutes in a day
    var updatedData = generateData();

    // First, clear existing descriptions
    updatedData.forEach(dataItem => {
        dataItem.additionalLabel = "";
        dataItem.color = remainingColor;
        dataItem.stroke = remainingColor;
        dataItem.hidden = false;
    });

    if (shifts && shifts.length > 0) {
        // Apply new descriptions based on provided data
        shifts.forEach(slot => {
            var startIndex = slot.entryTotalMinutes;
            var endIndex = slot.exitTotalMinutes;
            endIndex = Math.min(endIndex, totalMinutes);
            var labelAssigned = false;
            var middleIndex = Math.floor((startIndex + endIndex) / 2); // Calculate the middle index

            updatedData.forEach((dataItem, index) => {
                if (index >= startIndex && index < endIndex) {
                    dataItem.color = slot.color;
                    dataItem.stroke = slot.color;
                    dataItem.index = slot.index; // Store the index
                    if (!labelAssigned && index === middleIndex) {
                        dataItem.additionalLabel = slot.description;
                        labelAssigned = true;
                    }
                }
            });
        });
    } else {
        container.innerHTML = 'No Data Found !';
    }

    chart.data = updatedData;
    chart.invalidateData();
}

function parseTimeToMinutes(time) {
    var [hour, minute] = time.split(':').map(Number);
    return hour * 60 + minute;
}

function generateData() {
    var data = [];
    for (var i = 0; i < 1440; i++) {
        var hour = Math.floor(i / 60);
        var label = (i % 60 === 0 && hour >= 0 && hour <= 23) ? hour.toString() : '';

        data.push({
            category: i,
            value: 1,
            lable: label,
            color: remainingColor,
            additionalLabel: "",
            index: null
        });
    }
    return data;
}

function displayTimeSlots(slots, indices) {
    slots.forEach((slot, index) => {
        var slotElement = document.createElement('div');
        slotElement.className = 'time-slot';
        slotElement.textContent = slot.name + ': ' + slot.description;
        slotElement.style.cursor = 'pointer';
        slotElement.dataset.index = indices[index]; // Store the index to highlight on click

        slotElement.addEventListener('click', function () {
            highlightSlot(indices[index]);
        });

        container.appendChild(slotElement);
    });
}

function highlightSlot(index) {
    // Reset previous highlight
    if (currentHighlight) {
        chart.series.values[0].slices.each(function (slice) {
            if (slice.dataItem && slice.dataItem.dataContext.index === currentHighlight.dataItem.dataContext.index) {
                // Restore the original fill and stroke colors
                var original = originalColors[slice.dataItem.dataContext.index];
                if (original) {
                    slice.fill = original.fill;
                    slice.stroke = original.stroke;
                    slice.scale = 1; // Restore the original scale
                }
            }
        });
    }

    // Highlight the new slot
    chart.series.values[0].slices.each(function (slice) {
        if (slice.dataItem && slice.dataItem.dataContext.index === index) {
            // Store the original colors if not already done
            if (!originalColors[index]) {
                originalColors[index] = {
                    fill: slice.fill,
                    stroke: slice.stroke
                };
            }

            // Apply highlight color and scale
            slice.fill = am4core.color("#0000ff"); // Highlight color
            slice.stroke = am4core.color("#0000ff"); // Highlight border

            // Animate the slice to draw attention
            // var animation = slice.animate({
            //     property: "scale",
            //     from: 1,
            //     to: 1.01,
            //     duration: 400
            // });

            // animation.events.on("animationended", function () {
            //     // Restore scale to normal after animation
            //     slice.animate({
            //         property: "scale",
            //         from: 1.01,
            //         to: 1,
            //         duration: 400
            //     });
            // });

            // Update the current highlight
            currentHighlight = slice;
        }
    });
}