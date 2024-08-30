var chart;
var slotColors = ["#FF0000", "#d50a7ac2", "#00FF00"]; // Red, Blue, Green
var remainingColor = "white";
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
        pieSeries.labels.template.text = "{additionalLabel}{lable}";
        pieSeries.labels.template.fontSize = 10;
        pieSeries.labels.template.wrap = true;
        pieSeries.labels.template.maxWidth = 100; //maxwidth of labels (shift-description)
        pieSeries.alignLabels = false;
        pieSeries.labels.template.radius = 0.7;
        pieSeries.labels.template.disabled = false;
        pieSeries.slices.template.tooltipText = "{additionalLabel}"; //shift-slice hover text
        
        pieSeries.labels.template.adapter.add("radius", function (radius, target) {
            if (target.dataItem && target.dataItem.dataContext.additionalLabel) {
                return 20; // Adjust this value to position the additional labels (shift-description)
            }
            return radius;
        });

          // Create break chart
          breakChart = am4core.create("breakChart", am4charts.PieChart);
          breakChart.data = generateData(); // Initially with placeholder data
          var breakSeries = breakChart.series.push(new am4charts.PieSeries());
          breakSeries.dataFields.value = "value";
          breakSeries.dataFields.category = "category";
          breakSeries.labels.template.disabled = true; // Hide labels on the break chart
          breakSeries.slices.template.propertyFields.fill = "color";
          breakSeries.slices.template.propertyFields.hidden = "hidden";
          breakSeries.slices.template.tooltipText = "{description}"; // Ensure `description` exists in data
  
          breakSeries.tooltip.autoTextColor = false;
          breakSeries.tooltip.label.fill = am4core.color("#000000"); // Optional: Set text color
          breakSeries.tooltip.background.fill = am4core.color("#FFFFFF"); // Optional
  
          // Apply scaling and positioning to the break chart
          breakChart.series.values.forEach(series => {
              series.slices.template.adapter.add("fillOpacity", function (opacity, target) {
                  // Adjust opacity for slices not in break slots
                  return target.dataItem && target.dataItem.dataContext.color === remainingColor ? 0.6 : 1;
              });
          });

        chart.legend = new am4charts.Legend();
        chart.legend.disabled = true;
    });

});

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
    var totalMinutes = 1440; // Total minutes in a day
    var updatedData = generateData();

    // First, clear existing descriptions
    updatedData.forEach(dataItem => {
        dataItem.additionalLabel = "";
        dataItem.color = remainingColor;
        dataItem.stroke = remainingColor;
        dataItem.hidden = false;
    });

    document.getElementById("displayDay").innerText = day;

    // if (shifts && shifts.length > 0) {
    //     // Apply new descriptions based on provided data
    //     shifts.forEach(slot => {
    //         var startIndex = slot.entryTotalMinutes;
    //         var endIndex = slot.exitTotalMinutes;
    //         endIndex = Math.min(endIndex, totalMinutes);
    //         var labelAssigned = false;
    //         if(startIndex < endIndex){
    //             var middleIndex = Math.floor((startIndex + endIndex) / 2); // Calculate the middle index
    //         }
    //         else if(startIndex > endIndex) {
    //             var middleIndex = Math.floor((startIndex  + 1440) / 2);
    //         }
            
    //         updatedData.forEach((dataItem, index) => {
    //             if (startIndex < endIndex) {
    //                 if (index >= startIndex && index < endIndex) {
    //                     dataItem.color = slot.color;
    //                     dataItem.stroke = slot.color;
    //                     dataItem.index = slot.index; // Store the index
    //                     if (!labelAssigned && index === middleIndex) {
    //                         dataItem.additionalLabel = slot.description;
    //                         labelAssigned = true;
    //                     }
    //                 }
    //             }
    //             else if (startIndex > endIndex) {
    //                 if (index >= startIndex || index < endIndex) {
    //                     dataItem.color = slot.color;
    //                     dataItem.stroke = slot.color;
    //                     dataItem.index = slot.index; // Store the index
    //                     if (!labelAssigned && index === middleIndex) {
    //                         dataItem.additionalLabel = slot.description;
    //                         labelAssigned = true;
    //                     }
    //                 }
    //             }
    //         });
    //     });
    // }
    // else {
    //     container.innerHTML = 'No Data Found !';
    // }
    shifts.forEach(breakItem => {
        var startIndex = breakItem.entryTotalMinutes;
        var endIndex = breakItem.exitTotalMinutes;
        endIndex = Math.min(endIndex, totalMinutes);

        updatedData.forEach((dataItem, index) => {
            if (startIndex < endIndex) {
                if (index >= startIndex && index < endIndex) {
                    dataItem.color = breakItem.color;
                    dataItem.stroke = breakItem.color;
                    dataItem.additionalLabel = index === Math.floor((startIndex + endIndex) / 2) ? breakItem.description : dataItem.additionalLabel;
                    dataItem.description = breakItem.description;
                }
            }
            else if (startIndex > endIndex) {
                if (index >= startIndex || index < endIndex) {
                    dataItem.color = breakItem.color;
                    dataItem.stroke = breakItem.color;
                    dataItem.additionalLabel = index === Math.floor((startIndex + endIndex) / 2) ? breakItem.description : dataItem.additionalLabel;
                    dataItem.description = breakItem.description;
                }
            }
        });
    });

    chart.data = updatedData;
    document.getElementById('myChart').style.display = 'block';
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
            var animation = slice.animate({
                property: "scale",
                from: 1,
                to: 1.01,
                duration: 400
            });

            animation.events.on("animationended", function () {
                // Restore scale to normal after animation
                slice.animate({
                    property: "scale",
                    from: 1.01,
                    to: 1,
                    duration: 400
                });
            });

            // Update the current highlight
            currentHighlight = slice;
        }
    });
}

function updateBreakChart(breaks) {
    var totalMinutes = 1440; // Total minutes in a day
    var updatedData = generateData();

    // Reset all slices
    updatedData.forEach(dataItem => {
        // dataItem.color = remainingColor;
        // dataItem.stroke = remainingColor;
        dataItem.additionalLabel = "";
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
                    dataItem.additionalLabel = index === Math.floor((startIndex + endIndex) / 2) ? breakItem.description : dataItem.additionalLabel;
                    dataItem.description = breakItem.description;
                }
            }
            else if (startIndex > endIndex) {
                if (index >= startIndex || index < endIndex) {
                    dataItem.color = breakItem.color;
                    dataItem.stroke = breakItem.color;
                    dataItem.additionalLabel = index === Math.floor((startIndex + endIndex) / 2) ? breakItem.description : dataItem.additionalLabel;
                    dataItem.description = breakItem.description;
                }
            }
        });
    });

    // Apply the data to the break chart
    breakChart.data = updatedData;
    breakChart.invalidateData();
}