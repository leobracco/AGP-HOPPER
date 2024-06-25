document.addEventListener('deviceready', onDeviceReady, false);

var gateway = 'ws://192.168.1.1:81';
var pesoEnKg;
var descarga = false;
var Tara;
var websocket;
var totalRelays = 24; // Número total de relés

function initWebSocket() {
  console.log("Trying to open a WebSocket connection...");
  websocket = new WebSocket(gateway);

  // Manejadores de eventos
  websocket.onopen = onOpen;
  websocket.onclose = onClose;
  websocket.onmessage = onMessage;
  websocket.onerror = onError; // Agrega el manejo del evento de error
}

function onOpen(event) {
  console.log("WebSocket connection opened:", event);
}

function onClose(event) {
  console.log("WebSocket connection closed:", event);

  // Intenta reconectar después de un breve intervalo (por ejemplo, 5 segundos)
  setTimeout(initWebSocket, 5000);
}

function onMessage(event) {
  console.log("WebSocket message received:", event.data);

  try {
    if (event.data && event.data.trim()) {
      var jsonData = JSON.parse(event.data);
      switch (jsonData.type) {
        case "Balanza":
          handleBalanza(jsonData);
          break;
        case "CalibrationMsj":
          $("#Text").html(jsonData.Text);
          break;
        case "Motor":
          $("#liveRPM").html(jsonData.rpm + "RPM");
          break;
        case "Calibration":
          handleCalibration(jsonData);
          break;
        case "RelayState":
          handleRelayState(jsonData);
          break;
        default:
          console.log("Tipo de mensaje no válido:", jsonData.type);
      }
    } else {
      console.warn("Mensaje vacío o inválido recibido:", event.data);
    }
  } catch (error) {
    console.error("Error al analizar el mensaje JSON:", error);
  }
}

function onError(event) {
  console.error("WebSocket error:", event);
}

function handleBalanza(jsonData) {
  pesoEnKg = Number(parseFloat(jsonData.peso));
  $("#pesoActual").html(pesoEnKg + "<span class='text-success text-sm font-weight-bolder'>Kg</span>");
  //$("#factorActual").val(jsonData.factorActual );
 
 rpm = Number(parseFloat(jsonData.rpm));
  $("#liveRPM").html(rpm + "<span class='text-success text-sm font-weight-bolder'>RPM</span>");
  if (descarga) {
    $("#descargaActual").html(Tara - pesoEnKg + "<span class='text-success text-sm font-weight-bolder'>Kg</span>");
  }
}

function handleCalibration(jsonData) {
  const FactorCal = Number(parseFloat(jsonData.FactorCal));
  const PesoCal = parseFloat(jsonData.peso);
  $("#FactorCal").val(FactorCal);
  $("#PesoCal").val(PesoCal < 0 ? PesoCal * -1 : PesoCal);
}

function handleRelayState(jsonData) {
  console.log("RelayState received:", jsonData);
  if (jsonData.relays && Array.isArray(jsonData.relays)) {
    jsonData.relays.forEach(function (relay) {
      var relayNumber = relay.relay;
      var relayState = relay.state;
      updateInterface(relayNumber, relayState);
    });
  } else {
    console.log("Formato de datos incorrecto");
  }
}

function updateInterface(relayNumber, relayState) {
  console.log("El relay:" + relayNumber + " pasó a:" + relayState);
  var element = $("#" + relayNumber);

  if (element.is("button")) {
    if (relayState) {
      element.removeClass('btn-success').addClass('btn-warning');
    } else {
      element.removeClass('btn-warning').addClass('btn-success');
    }
  } else if (element.is(":checkbox")) {
    element.prop("checked", relayState);
  }
}

function onDeviceReady() {
  console.log("Cordova está listo");
  initWebSocket();
}

function On(id) {
  const mensaje = {
    relay: id,
    state: 1,
    type: "relay_state",
  };
  console.log("Botón con id:", id);
  var element = $("#" + id);
  element.removeClass('btn btn-success').addClass('btn btn-warning');
  websocket.send(JSON.stringify(mensaje));
}

function Off(id) {
  const mensaje = {
    relay: id,
    state: 0,
    type: "relay_state",
  };
  var element = $("#" + id);
  element.removeClass('btn btn-warning').addClass('btn btn-success');
  websocket.send(JSON.stringify(mensaje));
}

$("#ButtonUpdate").on("touchstart", function () {
  console.log("Botón ButtonUpdate");
  const mensaje = { type: "Update" };
  websocket.send(JSON.stringify(mensaje));
});

$("#ButtonFactorCalibracion").on("touchstart", function () {
  console.log("Botón presionado");
  const mensaje = {
    calibration_peso: $("#FactorCalibracion").val(),
    type: "calibration_peso"
  };
  websocket.send(JSON.stringify(mensaje));
});

$("#Cinta").on("click touchstart", function () {
  handleCheckboxChange(this, "Cinta");
});

$("#CintaTubo").on("click touchstart", function () {
  handleCheckboxChange(this, "CintaTubo");
});

$("#Luz1").on("click touchstart", function () {
  handleCheckboxChange(this, "Luz1");
});

$("#Luz2").on("click touchstart", function () {
  handleCheckboxChange(this, "Luz2");
});

$(".btn.btn-success").on("touchstart", function () {
  On($(this).attr('id'));
});

$(".btn.btn-success").on("touchend", function () {
  Off($(this).attr('id'));
});

var State = 'INICIO';
var mensaje;
var mensajeCal;

$(document).ready(function () {
  $('#ButtonCalibracion').on ("touchstart",handleCalibrationButton);
  $('#controles').dataTable({
    info: false,
    pageLength: 4,
    ordering: false,
    searching: false,
    lengthChange: false,
    fixedColumns: true,
    pagingType: 'numbers',
    scrollX: false
  });
});

function handleCheckboxChange(checkbox, relayName) {
  console.log(`Botón ${relayName} presionado`);
  descarga = true;
  Tara = pesoEnKg;
  var isChecked = $(checkbox).is(':checked');
  const mensaje = {
    relay: relayName,
    state: isChecked ? 1 : 0,
    type: "relay_state"
  };
  websocket.send(JSON.stringify(mensaje));
}

function handleCalibrationButton() {
  
  
      mensajeCal = { factor_calibracion: $("#FactorCal").val(), type: "CalState" };
  
  websocket.send(JSON.stringify(mensajeCal));
}
