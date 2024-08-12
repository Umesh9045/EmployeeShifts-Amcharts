const standard_In = 9.5;  // 9:30 AM
const standard_Out = 18.5; // 6:30 PM
const standard_WorkHrs = 9; // 9 Hours

var chart;
var highlightedSlices = [];
var unhighlightedSlices = [];

// Calculate Before Shift Work Time
function beforeShiftTime(inTime) {
    return inTime < standard_In ? standard_In - inTime : 0;
}

// Calculate After Shift Work Time
function afterShiftTime(outTime) {
    return outTime > standard_Out ? outTime - standard_Out : 0;
}

// Calculate Total Overtime
function calculateOverTime(totalTime) {
    return totalTime > standard_WorkHrs ? totalTime - standard_WorkHrs : 0;
}

// Display Shift Data on HTML Page
function displayShiftDetails(totalWorkTime, beforeShiftTime, afterShiftTime, totalOverTime, normalShiftTime) {
    const divShiftDetails = document.getElementById("shift_details");
    const spanTotalWorkTime = document.getElementById("span_totalWorkTime");
    const spanTotalOverTime = document.getElementById("span_totalOverTime");
    const spanBeforeShiftTime = document.getElementById("span_beforeShiftTime");
    const spanNormalShiftTime = document.getElementById("span_normalShiftTime");
    const spanAfterShiftTime = document.getElementById("span_afterShiftTime");

    spanTotalWorkTime.textContent = decimalToTime(totalWorkTime);
    spanTotalOverTime.textContent = decimalToTime(totalOverTime);
    spanBeforeShiftTime.textContent = decimalToTime(beforeShiftTime);
    spanNormalShiftTime.textContent = decimalToTime(normalShiftTime);
    spanAfterShiftTime.textContent = decimalToTime(afterShiftTime);

    // Unhide the div which contains shift data
    if (divShiftDetails.style.display !== 'block') {
        divShiftDetails.style.display = "block";
    }
}

function decimalToTime(decimal) {
    const hours = Math.floor(decimal);
    const minutes = Math.round((decimal - hours) * 60);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function timeToDecimal(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours + minutes / 60;
}

function calculateTime() {
    const inTime = document.getElementById('inTime').value;
    const outTime = document.getElementById('outTime').value;

    const inTimeDecimal = timeToDecimal(inTime);
    const outTimeDecimal = timeToDecimal(outTime);

    if (isNaN(inTimeDecimal) || isNaN(outTimeDecimal) || inTimeDecimal < 0 || inTimeDecimal > 24 || outTimeDecimal < 0 || outTimeDecimal > 24) {
        alert('In time and out time must be between 0 to 24 hours.');
        return;
    }
    if (outTimeDecimal <= inTimeDecimal) {
        alert('Out time must be greater than in time.');
        return;
    }

    const totalWorkTime = outTimeDecimal - inTimeDecimal; // Calculate total work time
    const beforeShift = beforeShiftTime(inTimeDecimal); // Calculate before shift work time
    const afterShift = afterShiftTime(outTimeDecimal); // Calculate after shift work time
    const totalOverTime = calculateOverTime(totalWorkTime); // Calculate total overtime
    const normalShiftTime = totalWorkTime - beforeShift - afterShift; // Calculate normal shift work time

    // Display employee shift data on HTML
    displayShiftDetails(totalWorkTime, beforeShift, afterShift, totalOverTime, normalShiftTime);

    // Display visual pie chart
    highlightSlice();
}   

function highlightSlice() {
    highlightedSlices = [];
    unhighlightedSlices = [];

    var entryTime = document.getElementById('inTime').value;
    var exitTime = document.getElementById('outTime').value;

    var highlightedColor = getRandomColor();
    var unhighlightedColor = getRandomColor();

    var entryHour = parseInt(entryTime.split(':')[0]);
    var exitHour = parseInt(exitTime.split(':')[0]);
    var entryMinute = parseInt(entryTime.split(':')[1]);
    var exitMinute = parseInt(exitTime.split(':')[1]);


    chart.data.forEach(function (dataItem, index) {
        var hour = Math.floor(dataItem.category / 60);
        var minute = dataItem.category % 60;
        var highlight = false;

        if (entryHour === exitHour) {
            if (hour === entryHour && entryMinute <= minute && minute <= exitMinute) {
                highlight = true;
            }
        } else {
            if (hour === entryHour && entryMinute <= minute) {
                highlight = true;
            }
            if (hour === exitHour && minute <= exitMinute) {
                highlight = true;
            }
            if (entryHour < exitHour && hour > entryHour && hour < exitHour) {
                highlight = true;
            }
            if (entryHour > exitHour && (hour > entryHour || hour < exitHour)) {
                highlight = true;
            }
        }

        if (highlight) {
            dataItem.color = highlightedColor;
            dataItem.stroke = highlightedColor;
            highlightedSlices.push(index);
            // if (index % 60 === 0 || index === 1439) {
            //     dataItem.stroke = "white";
            // }

        } else {
            dataItem.color = unhighlightedColor;
            dataItem.stroke = unhighlightedColor;
            unhighlightedSlices.push(index);
            // if (index % 60 === 0 || index === 1439) {
            //     dataItem.stroke = "white";
            // }
        }
    });
    if (highlightedSlices.length > 0) {
        var highlightedmiddleIndex = highlightedSlices[(Math.floor(highlightedSlices.length / 2))];
    }
    if (unhighlightedSlices.length > 0) {
        var unhighlightedmiddleIndex = unhighlightedSlices[(Math.floor(unhighlightedSlices.length / 2))];
    }
    chart.data.forEach(function (dataItem, index) {
        if (index === highlightedmiddleIndex) {
            dataItem.additionalLabel = "Highlighted";
        } else if (index === unhighlightedmiddleIndex) {
            dataItem.additionalLabel = "UnHighlighted";
        } else {
            dataItem.additionalLabel = "";
        }
    });
    chart.invalidateData();
}

am4core.ready(function () {
    am4core.useTheme(am4themes_animated);

    chart = am4core.create("myChart", am4charts.PieChart);

    chart.data = generateData();

    var pieSeries = chart.series.push(new am4charts.PieSeries());
    pieSeries.dataFields.value = "value";
    pieSeries.dataFields.category = "category";

    pieSeries.slices.template.strokeOpacity = 1;
    pieSeries.slices.template.propertyFields.stroke = "stroke"; // Use stroke property for border color
    pieSeries.slices.template.propertyFields.fill = "color";

    pieSeries.labels.template.text = "{additionalLabel}\u00A0\u00A0{lable}";
    pieSeries.labels.template.fontSize = 10;
    pieSeries.labels.template.wrap = true;
    pieSeries.labels.template.maxWidth = 200;
    pieSeries.labels.template.truncate = true; // Disable truncating of labels

    pieSeries.alignLabels = false;
    pieSeries.labels.template.radius = 0.7;
    pieSeries.labels.template.relativeRotation = 90;

    //pieSeries.ticks.template.disabled = true;
    pieSeries.labels.template.disabled = false; // Disable default labels

    chart.legend = new am4charts.Legend();
    chart.legend.disabled = true;

    document.addEventListener("DOMContentLoaded", function () {
        colorSlices();
    });
});

function colorSlices() {
    chart.data.forEach(function (dataItem, index) {
        var hour = Math.floor(dataItem.category / 60);
        var label = (index % 60 === 0) ? hour.toString() : ''; // Label every 60th slice with the hour
        dataItem.label = label;

        // Adjust the angle to show only 24 slices
        var angle = (360 / 24) * index;
        dataItem.startAngle = angle;
        dataItem.endAngle = angle + (360 / 24);
        // if (index % 60 === 0 || index === 1439) {
        //     dataItem.stroke = "white";
        // }

    });

    chart.invalidateData();
}

function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
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
            color: "#cce3d2",
            additionalLabel: ""
        });
    }
    return data;
}
document.getElementById('myChart').style.width = '600px';
document.getElementById('myChart').style.height = '600px';