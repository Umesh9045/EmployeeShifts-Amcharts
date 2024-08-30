var chart;
var breakChart;
var slotColors = ["#FF0000", "#d50a7ac2", "#00FF00"]; // Red, Blue, Green
var remainingColor = "white";
var currentHighlightChart = null;
var currentHighlightBreakChart = null; // Separate highlight tracking for breakChart
var originalColors = {
    chart: {}, // Store original colors for the main chart
    breakChart: {} // Store original colors for the break chart
};

var container = document.getElementById('timeSlotsContainer');

document.addEventListener("DOMContentLoaded", function () {
    am4core.ready(function () {
        am4core.useTheme(am4themes_animated);

        // Initialize main chart
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
        pieSeries.labels.template.text = "{additionalLabel}{lable}";
        pieSeries.labels.template.fontSize = 10;
        pieSeries.labels.template.wrap = true;
        pieSeries.labels.template.maxWidth = 100; //maxwidth of labels (shift-description)
        pieSeries.alignLabels = false;
        pieSeries.labels.template.radius = 0.7;
        pieSeries.labels.template.disabled = false;
        pieSeries.slices.template.tooltipText = ""; //shift-slice hover text
        
        pieSeries.labels.template.adapter.add("radius", function (radius, target) {
            if (target.dataItem && target.dataItem.dataContext.additionalLabel) {
                // pieSeries.slices.template.tooltipText = target.dataItem.dataContext.additionalLabel;
                return 20; // Adjust this value to position the additional labels (shift-description)
            }
            return radius;
        });


        // Initialize breakChart
        breakChart = am4core.create("breakChart", am4charts.PieChart);
        breakChart.data = generateData();

        var breakSeries = breakChart.series.push(new am4charts.PieSeries());
        breakSeries.dataFields.value = "value";
        breakSeries.dataFields.category = "category";
        breakSeries.labels.template.disabled = true;
        breakSeries.slices.template.propertyFields.fill = "color";
        breakSeries.slices.template.propertyFields.hidden = "hidden";
        breakSeries.slices.template.tooltipText = "{description}";

        breakSeries.tooltip.autoTextColor = false;
        breakSeries.tooltip.label.fill = am4core.color("#000000");
        breakSeries.tooltip.background.fill = am4core.color("#FFFFFF");

        breakChart.series.values.forEach(series => {
            series.slices.template.adapter.add("fillOpacity", function (opacity, target) {
                return target.dataItem && target.dataItem.dataContext.color === remainingColor ? 0.6 : 1;
            });
        });

        chart.legend = new am4charts.Legend();
        chart.legend.disabled = true;
    });
});


function highlightSlot(index) {
    console.log("Highlighting slot with index:", index);

    // Reset previous highlight in chart
    if (currentHighlightChart) {
        chart.series.values[0].slices.each(function (slice) {
            if (slice.dataItem && slice.dataItem.dataContext.index === currentHighlightChart.dataItem.dataContext.index) {
                var original = originalColors.chart[slice.dataItem.dataContext.index];
                if (original) {
                    console.log("Restoring chart slice colors for index:", slice.dataItem.dataContext.index);
                    slice.fill = original.fill;
                    slice.stroke = original.stroke;
                    slice.scale = 1;
                }
            }
        });
        chart.invalidateRawData();
        chart.validate();
    }

    // Reset previous highlight in breakChart
    if (currentHighlightBreakChart) {
        breakChart.series.values[0].slices.each(function (slice) {
            if (slice.dataItem && slice.dataItem.dataContext.index === currentHighlightBreakChart.dataItem.dataContext.index) {
                var original = originalColors.breakChart[slice.dataItem.dataContext.index];
                if (original) {
                    console.log("Restoring original colors for breakChart slice with index:", slice.dataItem.dataContext.index);
                    slice.fill = original.fill;
                    slice.stroke = original.stroke;
                    slice.scale = 1;
                }
            }
        });
        breakChart.invalidateRawData();
        breakChart.validate();
    }

    // Highlight the new slot in chart
    chart.series.values[0].slices.each(function (slice) {
        if (slice.dataItem && slice.dataItem.dataContext.index === index) {
            if (!originalColors.chart[index]) {
                originalColors.chart[index] = {
                    fill: slice.fill,
                    stroke: slice.stroke
                };
                console.log("Stored original colors for chart slice with index:", index, originalColors.chart[index]);
            }

            slice.fill = am4core.color("#0000ff");
            slice.stroke = am4core.color("#0000ff");

            var animation = slice.animate({
                property: "scale",
                from: 1,
                to: 1.01,
                duration: 400
            });

            animation.events.on("animationended", function () {
                slice.animate({
                    property: "scale",
                    from: 1.01,
                    to: 1,
                    duration: 400
                });
            });

            currentHighlightChart = slice;
        }
    });

    // Highlight the new slot in breakChart
    breakChart.series.values[0].slices.each(function (slice) {
        console.log("Checking slice:", slice.dataItem); // Log the data item for each slice
        if (slice.dataItem && slice.dataItem.dataContext.index === index) {
            console.log("Found slice to highlight in breakChart with index:", index);

            // Additional checks to ensure slice data exists
            if (!slice.fill || !slice.stroke) {
                console.error("Slice does not have fill or stroke properties.", slice);
                return; // Exit if there's an issue with the slice properties
            }

            if (!originalColors.breakChart[index]) {
                originalColors.breakChart[index] = {
                    fill: slice.fill,
                    stroke: slice.stroke
                };
                console.log("Stored original colors for breakChart slice with index:", index, originalColors.breakChart[index]);
            }

            // Apply the highlight color
            slice.fill = am4core.color("#0000ff");
            slice.stroke = am4core.color("#0000ff");

            // Log the application of highlight colors
            console.log("Applied highlight color to breakChart slice with index:", index);

            currentHighlightBreakChart = slice;
        } else {
            console.log("Slice not found for index:", index);
        }
    });

    breakChart.invalidateRawData();
    breakChart.validate();
    chart.invalidateRawData();
    chart.validate();
}

function readValue(day) {
    container.innerHTML = ''; // Clear existing slots
    document.getElementById("displayDay").innerText = "";

    showLoadingSpinner();
    const selectElement = document.getElementById('weekdays');
    const selectedValue = selectElement.value;  // Sunday
    loadChartData(selectedValue);
}

function showLoadingSpinner() {
    document.getElementById('weekdaySubmit').style.display = 'none';
    document.getElementById('myChart').style.display = 'none';
    document.getElementById('loading-spinner').style.display = 'block';
}

function hideLoadingSpinner() {
    document.getElementById('loading-spinner').style.display = 'none';
    document.getElementById('weekdaySubmit').style.display = 'block';
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

                updateChart(shifts, day);
                updateBreakChart(shifts);
            } else {
                var shifts = [];
                updateChart(shifts, day);
                updateBreakChart(shifts);
                container.innerHTML = 'No Data Found !';
            }
            hideLoadingSpinner();
        })
        .catch(error => {
            console.error('Error loading data:', error);
            hideLoadingSpinner();
        });
}

function updateChart(shifts, day) {
    var totalMinutes = 1440;
    var updatedData = generateData();

    updatedData.forEach(dataItem => {
        dataItem.additionalLabel = "";
        dataItem.color = remainingColor;
        dataItem.stroke = remainingColor;
        dataItem.hidden = false;
    });

    document.getElementById("displayDay").innerText = day;

    if (shifts && shifts.length > 0) {
        shifts.forEach(slot => {
            var startIndex = slot.entryTotalMinutes;
            var endIndex = slot.exitTotalMinutes;
            endIndex = Math.min(endIndex, totalMinutes);
            var middleIndex = (startIndex + (startIndex < endIndex ? endIndex : endIndex + totalMinutes)) / 2;

            updatedData.forEach((dataItem, index) => {
                if ((startIndex < endIndex && index >= startIndex && index < endIndex) || 
                    (startIndex > endIndex && (index >= startIndex || index < endIndex))) {
                    dataItem.color = slot.color;
                    dataItem.stroke = slot.color;
                    dataItem.index = slot.index;
                    if (Math.abs(index - middleIndex) < 1) {
                        dataItem.additionalLabel = slot.description;
                    }
                }
            });
        });
    } else {
        container.innerHTML = 'No Data Found !';
    }

    console.log("Updated chart data:", updatedData);

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
            description:"",
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

function updateBreakChart(breaks) {
    var totalMinutes = 1440; // Total minutes in a day
    var updatedData = generateData();

    // Reset all slices
    updatedData.forEach(dataItem => {
        dataItem.color = remainingColor;
        dataItem.stroke = remainingColor;
        dataItem.additionalLabel = "";
        dataItem.description = ""; // Clear description
    });

    // Update slices based on breaks
    breaks.forEach(breakItem => {
        var startIndex = breakItem.entryTotalMinutes;
        var endIndex = breakItem.exitTotalMinutes;
        endIndex = Math.min(endIndex, totalMinutes);

        updatedData.forEach((dataItem, index) => {
            if (startIndex < endIndex) {
                if (index >= startIndex && index < endIndex) {
                    dataItem.color = breakItem.color;
                    dataItem.stroke = breakItem.color;
                    if (index === Math.floor((startIndex + endIndex) / 2)) {
                        dataItem.additionalLabel = breakItem.description;
                    }
                    dataItem.description = breakItem.description;
                }
            } else if (startIndex > endIndex) { // Handle wrap-around
                if (index >= startIndex || index < endIndex) {
                    dataItem.color = breakItem.color;
                    dataItem.stroke = breakItem.color;
                    if (index === Math.floor((startIndex + totalMinutes + endIndex) / 2) % totalMinutes) {
                        dataItem.additionalLabel = breakItem.description;
                    }
                    dataItem.description = breakItem.description;
                }
            }
        });
    });

    console.log("Updated breakChart data:", updatedData);

    // Apply the data to the break chart
    breakChart.data = updatedData;
    breakChart.invalidateData();
}