
let carrito = [];
let wishlist = new Set();
let intervaloCarrusel = null;
let indiceCarrusel = 0;

function escaparHTML(valor) {
    return String(valor).replace(/[&<>"']/g, caracter => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[caracter]);
}

// --------------------------------------------------------------------------
// NOTIFICACIÓN TOAST
// --------------------------------------------------------------------------
function mostrarToast(mensaje) {
    let toast = document.getElementById('toast-notificacion');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast-notificacion';
        toast.className = 'toast-cf';
        document.body.appendChild(toast);
    }
    toast.innerHTML = `<i class="fa-solid fa-circle-check"></i> <span>${escaparHTML(mensaje)}</span>`;
    toast.classList.add('mostrar');
    setTimeout(() => {
        toast.classList.remove('mostrar');
    }, 2400);
}

// --------------------------------------------------------------------------
// COTIZACIÓN DE PRODUCTOS (INTEGRADO AL HEADER SUPERIOR Y AL DRAWER)
// --------------------------------------------------------------------------
function agregarAlCarrito(nombre, precio, imagen) {
    if (!nombre) return;

    const productoExistente = carrito.find(item => item.nombre === nombre);
    if (productoExistente) {
        productoExistente.cantidad++;
    } else {
        carrito.push({
            nombre,
            imagen: imagen || 'imagenes/Cancamo-Cerrado-300x300.webp',
            cantidad: 1
        });
    }

    actualizarCarritoUI();
    mostrarToast(`"${nombre}" añadido a la cotización`);

    // Animación pulso en el botón del header
    const cartIcon = document.getElementById('btn-header-cart');
    if (cartIcon) {
        cartIcon.style.transform = 'scale(1.18)';
        setTimeout(() => {
            cartIcon.style.transform = 'scale(1)';
        }, 250);
    }
}

function cambiarCantidad(indice, delta) {
    if (!carrito[indice]) return;
    carrito[indice].cantidad += delta;
    if (carrito[indice].cantidad <= 0) {
        carrito.splice(indice, 1);
    }
    actualizarCarritoUI();
}

function eliminarDelCarrito(indice) {
    if (!carrito[indice]) return;
    const nombre = carrito[indice].nombre;
    carrito.splice(indice, 1);
    actualizarCarritoUI();
    mostrarToast(`"${nombre}" eliminado de la cotización`);
}

function actualizarCarritoUI() {
    const lista = document.getElementById('carrito-items');
    const headerCartCount = document.getElementById('header-cart-count');
    const headerCartTotal = document.getElementById('header-cart-total');
    const botonWhatsApp = document.getElementById('enviar-whatsapp');

    const totalCantidad = carrito.reduce((suma, item) => suma + item.cantidad, 0);

    // Actualizar contador superior en el header
    if (headerCartCount) headerCartCount.textContent = totalCantidad;
    if (headerCartTotal) headerCartTotal.textContent = totalCantidad > 0 ? `${totalCantidad} ítems` : 'Cotizar';
    const floatingCartCount = document.getElementById('floating-cart-count');
    if (floatingCartCount) floatingCartCount.textContent = totalCantidad;

    if (botonWhatsApp) botonWhatsApp.disabled = carrito.length === 0;

    // Renderizar lista en el drawer
    if (lista) {
        if (carrito.length === 0) {
            lista.innerHTML = `
                <div class="carrito-vacio-aviso">
                    <i class="fa-solid fa-basket-shopping"></i>
                    <p><strong>LISTA DE COTIZACIÓN VACÍA</strong></p>
                    <p style="font-size: 0.85rem; color: #9ca3af;">Aún no has agregado productos para cotizar.</p>
                </div>
            `;
        } else {
            // Se agrega un encabezado indicando el total de productos seleccionados
            let htmlItems = `
                <div class="carrito-resumen-cabecera">
                    <span>Llevas <strong>${totalCantidad}</strong> ${totalCantidad === 1 ? 'producto' : 'productos'}</span>
                </div>
            `;

            htmlItems += carrito.map((item, indice) => `
                <li class="carrito-item-fila">
                    <img src="${escaparHTML(item.imagen)}" alt="${escaparHTML(item.nombre)}" class="carrito-item-img" onerror="this.src='imagenes/Cancamo-Cerrado-300x300.webp'">
                    <div class="carrito-item-detalles">
                        <h4 class="carrito-item-nombre">${escaparHTML(item.nombre)}</h4>
                    </div>
                    <div class="carrito-controles-qty">
                        <button type="button" data-accion="modificar-cantidad" data-indice="${indice}" data-delta="-1" aria-label="Restar">−</button>
                        <span class="qty-numero">${item.cantidad}</span>
                        <button type="button" data-accion="modificar-cantidad" data-indice="${indice}" data-delta="1" aria-label="Sumar">+</button>
                    </div>
                    <button type="button" class="carrito-btn-eliminar" data-accion="quitar" data-indice="${indice}" title="Eliminar producto">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </li>
            `).join('');

            lista.innerHTML = htmlItems;
        }
    }
}

// --------------------------------------------------------------------------
// COTIZACIÓN POR WHATSAPP (A número de MW)
// --------------------------------------------------------------------------
// Números de WhatsApp de cada vendedor (formato 569XXXXXXXX).
// Francisco y Juan Carlos usan el número de sala hasta tener los suyos.
const VENDEDORES = {
    valentina:  { nombre: 'Valentina Palavecinos (Sala)', numero: '56972991109' },
    francisco:  { nombre: 'Francisco Hoces (Terreno)', numero: '56972991109' },
    juancarlos: { nombre: 'Juan Carlos Burgos (Terreno)', numero: '56972991109' }
};

function enviarCotizacionWhatsApp() {
    if (carrito.length === 0) return;

    const vendedor = VENDEDORES[document.getElementById('vendedor-carrito')?.value] || VENDEDORES.valentina;

    const cliente = document.getElementById('cliente-carrito')?.value.trim() || 'Particular / No especificado';
    const direccion = document.getElementById('direccion-carrito')?.value.trim() || 'Retiro en sucursal (Av. Ecuador 290B, Chillán)';
    const detalleProductos = carrito.map(item =>
        `• ${item.cantidad}x ${item.nombre}`
    ).join('\n');

    const mensaje = [
        '*SOLICITUD DE COTIZACIÓN - SOLDADURA Y SUMINISTROS MW*',
        `*Cliente:* ${cliente}`,
        `*Dirección / Modalidad:* ${direccion}`,
        `*Vendedor:* ${vendedor.nombre}`,
        '',
        '*Productos a Cotizar:*',
        detalleProductos,
        '',
        'Hola, quisiera solicitar una cotización formal y consultar disponibilidad para estos productos. ¡Muchas gracias!'
    ].join('\n');

    window.open(`https://wa.me/${vendedor.numero}?text=${encodeURIComponent(mensaje)}`, '_blank', 'noopener,noreferrer');
}

// --------------------------------------------------------------------------
// CARRUSEL DE OFERTAS
// --------------------------------------------------------------------------
function inicializarCarrusel() {
    const grande = document.querySelector('.grande');
    const puntos = document.querySelectorAll('.punto');
    if (!grande || puntos.length === 0) return;
    grande.style.width = `${puntos.length * 100}%`;
    grande.querySelectorAll(':scope > *').forEach(s => s.style.width = `${100 / puntos.length}%`);

    function moverCarrusel(indice) {
        indiceCarrusel = indice;
        grande.style.transform = `translateX(${indice * -100 / puntos.length}%)`;
        puntos.forEach((p, i) => {
            p.classList.toggle('activo', i === indice);
        });
    }

    puntos.forEach((p, i) => {
        p.addEventListener('click', () => {
            moverCarrusel(i);
            reiniciarIntervalo();
        });
    });

    function avanzarAutomatico() {
        indiceCarrusel = (indiceCarrusel + 1) % puntos.length;
        moverCarrusel(indiceCarrusel);
    }

    function iniciarIntervalo() {
        intervaloCarrusel = setInterval(avanzarAutomatico, 3500);
    }

    function reiniciarIntervalo() {
        clearInterval(intervaloCarrusel);
        iniciarIntervalo();
    }

    iniciarIntervalo();
}

// --------------------------------------------------------------------------
// INICIALIZACIÓN GENERAL DEL DOM
// --------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    // 1. Delegación de eventos para agregar productos
    document.addEventListener('click', (e) => {
        const btnAgregar = e.target.closest('[data-agregar-carrito]');
        if (btnAgregar) {
            const card = btnAgregar.closest('.producto-card-cf');
            if (card) {
                const nombre = card.dataset.nombre || card.querySelector('.producto-card-titulo')?.textContent.trim();
                const img = card.querySelector('img')?.getAttribute('src');
                agregarAlCarrito(nombre, 0, img);
            }
        }

        // Acciones dentro del drawer de cotización
        const btnAccionCarrito = e.target.closest('[data-accion]');
        if (btnAccionCarrito) {
            const accion = btnAccionCarrito.dataset.accion;
            const indice = Number(btnAccionCarrito.dataset.indice);
            if (accion === 'modificar-cantidad') {
                cambiarCantidad(indice, Number(btnAccionCarrito.dataset.delta));
            } else if (accion === 'quitar') {
                eliminarDelCarrito(indice);
            }
        }
    });

    // 2. Control de apertura y cierre del Drawer de Cotización
    const overlay = document.getElementById('carrito-overlay');
    const btnAbrirHeader = document.getElementById('btn-header-cart');
    const btnAbrirFlotante = document.getElementById('btn-carrito-flotante');
    btnAbrirFlotante?.addEventListener('click', abrirDrawer);
    const btnCerrar = document.getElementById('cerrar-carrito-btn');
    const btnSeguirComprando = document.getElementById('btn-seguir-comprando');

    function abrirDrawer() {
        if (!overlay) return;
        overlay.hidden = false;
        overlay.removeAttribute('hidden');
        document.body.style.overflow = 'hidden';
        actualizarCarritoUI();
    }

    function cerrarDrawer() {
        if (!overlay) return;
        overlay.hidden = true;
        overlay.setAttribute('hidden', '');
        document.body.style.overflow = '';
    }

    btnAbrirHeader?.addEventListener('click', abrirDrawer);
    btnCerrar?.addEventListener('click', cerrarDrawer);
    btnSeguirComprando?.addEventListener('click', cerrarDrawer);

    overlay?.addEventListener('click', (e) => {
        if (e.target === overlay) cerrarDrawer();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && overlay && !overlay.hidden) cerrarDrawer();
    });

    document.getElementById('enviar-whatsapp')?.addEventListener('click', enviarCotizacionWhatsApp);

    const tabItems = document.querySelectorAll('.tab-btn-item');
    const bloquesCategorias = document.querySelectorAll('.grupo-categoria-bloque');

    tabItems.forEach(tab => {
        tab.addEventListener('click', () => {
            tabItems.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            const categoriaSeleccionada = tab.dataset.tab;

            bloquesCategorias.forEach(bloque => {
                const catBloque = bloque.dataset.categoriaBloque;
                if (categoriaSeleccionada === 'todos' || catBloque === categoriaSeleccionada) {
                    bloque.style.display = 'block';
                    bloque.querySelectorAll('.producto-card-cf').forEach(card => card.style.display = 'flex');
                } else {
                    bloque.style.display = 'none';
                }
            });
        });
    });

    const inputBuscador = document.getElementById('buscador-input');
    const selectCategoria = document.getElementById('buscador-categoria');
    const btnBuscar = document.getElementById('btn-buscar');

    const normalizar = t => (t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    function realizarBusqueda() {
        const query = normalizar(inputBuscador?.value).trim();
        const categoriaFiltro = (selectCategoria?.value || '').toLowerCase().trim();

        bloquesCategorias.forEach(bloque => {
            const catBloque = (bloque.dataset.categoriaBloque || '').toLowerCase();
            const coincideCatBloque = !categoriaFiltro || catBloque === categoriaFiltro || categoriaFiltro === 'todos';
            
            let tarjetasVisibles = 0;
            const cards = bloque.querySelectorAll('.producto-card-cf');

            cards.forEach(prod => {
                const nombre = normalizar(prod.dataset.nombre);
                const cat = (prod.dataset.categoria || '').toLowerCase();
                const desc = normalizar(prod.querySelector('.producto-card-desc')?.textContent);
                const coincideTexto = !query || nombre.includes(query) || desc.includes(query) || cat.includes(query);
                const coincideCatProd = !categoriaFiltro || cat === categoriaFiltro || catBloque === categoriaFiltro;

                if (coincideTexto && coincideCatProd && coincideCatBloque) {
                    prod.style.display = 'flex';
                    tarjetasVisibles++;
                } else {
                    prod.style.display = 'none';
                }
            });

            if (tarjetasVisibles > 0) {
                bloque.style.display = 'block';
            } else {
                bloque.style.display = 'none';
            }
        });
    }

    inputBuscador?.addEventListener('input', realizarBusqueda);
    selectCategoria?.addEventListener('change', realizarBusqueda);
    btnBuscar?.addEventListener('click', realizarBusqueda);

    const parametrosBusqueda = new URLSearchParams(window.location.search);
    if (inputBuscador) inputBuscador.value = parametrosBusqueda.get('q') || '';
    if (selectCategoria) selectCategoria.value = parametrosBusqueda.get('categoria') || '';
    if (parametrosBusqueda.has('q') || parametrosBusqueda.has('categoria')) realizarBusqueda();

    const btnSubir = document.getElementById('boton-subir');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            if (btnSubir) btnSubir.style.display = 'flex';
        } else {
            if (btnSubir) btnSubir.style.display = 'none';
        }
    });

    btnSubir?.addEventListener('click', (e) => {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    const btnToggleCat = document.getElementById('btn-toggle-categorias');
    const dropdownCatWrap = document.querySelector('.categorias-dropdown-btn-wrap');
    btnToggleCat?.addEventListener('click', () => {
        dropdownCatWrap?.classList.toggle('abierto');
    });

    const wishlistCountBadge = document.getElementById('wishlist-count');
    document.querySelectorAll('[data-wishlist]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const id = btn.dataset.wishlist;
            if (wishlist.has(id)) {
                wishlist.delete(id);
                btn.classList.remove('activo');
                mostrarToast('Eliminado de tu lista de deseos');
            } else {
                wishlist.add(id);
                btn.classList.add('activo');
                mostrarToast('Añadido a tu lista de deseos');
            }
            if (wishlistCountBadge) wishlistCountBadge.textContent = wishlist.size;
        });
    });
    
    inicializarCarrusel();
    actualizarCarritoUI();
});

document.addEventListener('DOMContentLoaded', () => {
    const btnModoNoche = document.createElement('button');
    btnModoNoche.type = 'button';
    btnModoNoche.className = 'btn-modo-noche-flotante';
    btnModoNoche.id = 'boton-modo-noche';
    btnModoNoche.title = 'Cambiar modo noche';
    btnModoNoche.setAttribute('aria-label', 'Cambiar modo noche');
    btnModoNoche.innerHTML = '<i class="fa-solid fa-moon"></i>';
    document.body.appendChild(btnModoNoche);

    if (localStorage.getItem('modoNoche') === 'activo') {
        document.body.classList.add('modo-noche');
        btnModoNoche.innerHTML = '<i class="fa-solid fa-sun"></i>';
    }

    btnModoNoche.addEventListener('click', () => {
        document.body.classList.toggle('modo-noche');
        const estaActivo = document.body.classList.contains('modo-noche');
        
        if (estaActivo) {
            localStorage.setItem('modoNoche', 'activo');
            btnModoNoche.innerHTML = '<i class="fa-solid fa-sun"></i>';
            mostrarToast('Modo noche activado');
        } else {
            localStorage.setItem('modoNoche', 'inactivo');
            btnModoNoche.innerHTML = '<i class="fa-solid fa-moon"></i>';
            mostrarToast('Modo día activado');
        }
    });
});

// --------------------------------------------------------------------------
// BANNER "EQUIPO DESTACADO" ROTATIVO
// --------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    const banner = document.getElementById('banner-destacados');
    if (!banner) return;
    const slides = banner.querySelectorAll('.dest-slide');
    const puntos = banner.querySelectorAll('.dest-punto');
    let actual = 0, timer;
    const mostrar = i => {
        actual = (i + slides.length) % slides.length;
        slides.forEach((s, k) => { s.classList.toggle('activo', k === actual); s.setAttribute('aria-hidden', k === actual ? 'false' : 'true'); });
        puntos.forEach((p, k) => p.classList.toggle('activo', k === actual));
    };
    const iniciar = () => { clearInterval(timer); timer = setInterval(() => mostrar(actual + 1), 4000); };
    puntos.forEach((p, k) => p.addEventListener('click', () => { mostrar(k); iniciar(); }));
    banner.addEventListener('mouseenter', () => clearInterval(timer));
    banner.addEventListener('mouseleave', iniciar);
    iniciar();
});
