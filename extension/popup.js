'use strict';

const APP_URL_DEFAULT = 'https://mente-ten-iota.vercel.app';

const $ = (id) => document.getElementById(id);

let pestanaActual = null;

document.addEventListener('DOMContentLoaded', async () => {
  const guardado = await chrome.storage.local.get(['appUrl', 'token']);
  $('appUrl').value = guardado.appUrl || APP_URL_DEFAULT;
  $('token').value = guardado.token || '';

  $('btnTexto').addEventListener('click', guardarTexto);
  $('btnLink').addEventListener('click', guardarLink);
  $('btnSeleccion').addEventListener('click', guardarSeleccion);
  $('btnCaptura').addEventListener('click', capturarPantalla);

  await cargarPestana();
});

function estado(mensaje, tipo) {
  const caja = $('estado');
  caja.textContent = mensaje;
  caja.className = 'estado' + (tipo ? ' ' + tipo : '');
}

function urlHttp(valor) {
  return typeof valor === 'string' && /^https?:\/\/\S+$/i.test(valor) ? valor : undefined;
}

function leerConfig() {
  return {
    appUrl: $('appUrl').value.trim().replace(/\/+$/, ''),
    token: $('token').value.trim()
  };
}

function problemaConfig(cfg) {
  if (!cfg.token) return 'Falta el token. Genera uno en Mente / Foco.';
  if (!/^https?:\/\/\S+$/i.test(cfg.appUrl)) return 'La URL de Mente no es valida.';
  return null;
}

async function cargarPestana() {
  try {
    const pestanas = await chrome.tabs.query({ active: true, currentWindow: true });
    pestanaActual = pestanas && pestanas[0] ? pestanas[0] : null;
    $('paginaTitulo').textContent = (pestanaActual && pestanaActual.title) || 'Sin titulo';
    $('paginaUrl').textContent = (pestanaActual && pestanaActual.url) || '';
  } catch (error) {
    estado('No se pudo leer la pestana activa.', 'error');
  }
}

async function enviarCaptura(payload) {
  const cfg = leerConfig();
  await chrome.storage.local.set(cfg);

  const problema = problemaConfig(cfg);
  if (problema) {
    estado(problema, 'error');
    return false;
  }

  estado('Guardando...', 'info');
  try {
    const respuesta = await fetch(cfg.appUrl + '/api/captura', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + cfg.token
      },
      body: JSON.stringify(payload)
    });

    let datos = {};
    try {
      datos = await respuesta.json();
    } catch (error) {
      datos = {};
    }

    if (!respuesta.ok) {
      estado(datos.error || 'Error ' + respuesta.status, 'error');
      return false;
    }

    estado('Guardado en Mente.', 'ok');
    return true;
  } catch (error) {
    estado('No se pudo conectar con Mente.', 'error');
    return false;
  }
}

async function guardarTexto() {
  const contenido = $('nota').value.trim();
  if (!contenido) {
    estado('Escribe una nota antes de guardar.', 'error');
    return;
  }
  const ok = await enviarCaptura({
    tipo: 'texto',
    contenido,
    fuente: urlHttp(pestanaActual && pestanaActual.url)
  });
  if (ok) $('nota').value = '';
}

async function guardarLink() {
  const fuente = urlHttp(pestanaActual && pestanaActual.url);
  if (!fuente) {
    estado('Esta pestana no tiene un link guardable.', 'error');
    return;
  }
  const contenido = $('nota').value.trim();
  const payload = { tipo: 'link', fuente };
  if (contenido) payload.contenido = contenido;
  const ok = await enviarCaptura(payload);
  if (ok) $('nota').value = '';
}

async function guardarSeleccion() {
  if (!pestanaActual || typeof pestanaActual.id !== 'number') {
    estado('No hay una pestana activa.', 'error');
    return;
  }
  try {
    const resultados = await chrome.scripting.executeScript({
      target: { tabId: pestanaActual.id },
      func: () => (window.getSelection ? window.getSelection().toString() : '')
    });
    const seleccion =
      resultados && resultados[0] && resultados[0].result
        ? String(resultados[0].result).trim()
        : '';
    if (!seleccion) {
      estado('No hay texto seleccionado en la pagina.', 'error');
      return;
    }
    await enviarCaptura({
      tipo: 'texto',
      contenido: seleccion,
      fuente: urlHttp(pestanaActual.url)
    });
  } catch (error) {
    estado('No se pudo leer la seleccion.', 'error');
  }
}

async function capturarPantalla() {
  try {
    const dataUrl = await chrome.tabs.captureVisibleTab(null, { format: 'png' });
    if (!dataUrl || !/^data:image\//i.test(dataUrl)) {
      estado('No se pudo capturar la pantalla.', 'error');
      return;
    }
    const ok = await enviarCaptura({
      tipo: 'arte',
      mediaBase64: dataUrl,
      mediaMime: 'image/png',
      fuente: urlHttp(pestanaActual && pestanaActual.url)
    });
    if (ok) estado('Captura guardada en Biblioteca.', 'ok');
  } catch (error) {
    estado('No se pudo capturar esta pagina.', 'error');
  }
}
