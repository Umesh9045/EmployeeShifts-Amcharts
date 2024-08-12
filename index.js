var chart;
var highlightedSlices = [];
var unhighlightedSlices = [];
function highlightSlice() {
    highlightedSlices = [];
    unhighlightedSlices = [];
    var entryTimeInput = document.getElementById(`entry-time`);
    var exitTimeInput = document.getElementById(`exit-time`);
    var highlightedColor = getRandomColor();
    var unhighlightedColor = getRandomColor();

    // var highlightedColor = "#D1E9F6";

    var entryTime = entryTimeInput.value;
    var exitTime = exitTimeInput.value;

    var entryHour = parseInt(entryTime.split(':')[0]);
    var exitHour = parseInt(exitTime.split(':')[0]);
    var entryMinute = parseInt(entryTime.split(':')[1]);
    var exitMinute = parseInt(exitTime.split(':')[1]);

    if (
        isNaN(entryHour) ||
        isNaN(exitHour) ||
        entryHour < 0 ||
        entryHour > 23 ||
        exitHour < 0 ||
        exitHour > 23 ||
        isNaN(entryMinute) ||
        isNaN(exitMinute) ||
        entryMinute < 0 ||
        entryMinute > 59 ||
        exitMinute < 0 ||
        exitMinute > 59
    ) {
        alert("Please enter valid entry and exit times in the format HH:MM.");
        return;
    }

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
            if (index % 60 === 0 || index === 1439) {
                dataItem.stroke = "white";
            }

        } else {
            dataItem.color = unhighlightedColor;
            dataItem.stroke = unhighlightedColor;
            unhighlightedSlices.push(index);
            if (index % 60 === 0 || index === 1439) {
                dataItem.stroke = "white";
            }
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
        if (index % 60 === 0 || index === 1439) {
            dataItem.stroke = "white";
        }

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