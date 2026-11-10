# Kit AMPER D-IA — Empieza aquí

Este kit trae 3 carpetas. Ábrelas en este orden.

## 1 · LA-WEB (la tienda ya montada, para verla funcionar)

Es AMPER, la web de auriculares del vídeo, ya construida: la home con el ensamblaje explosionado, los 3 acabados, la página de producto, las reseñas. Todo funciona igual que en el vídeo, con las imágenes y vídeos ya cargados dentro.

**Cómo abrirla (Mac):**
1. Abre la app **Terminal** (Spotlight → escribe "Terminal")
2. Arrastra la carpeta `LA-WEB` a la ventana de Terminal y suelta (esto escribe la ruta sola)
3. Pulsa `Intro`
4. Escribe esto y pulsa `Intro`:
   ```
   python3 -m http.server 8080
   ```
5. Abre tu navegador y ve a: `http://localhost:8080`

No hace falta instalar nada más, `python3` ya viene en el Mac. Si tienes Windows y no te funciona, instala la extensión "Live Server" en VS Code y abre `index.html` con ella.

> Abrir `index.html` haciendo doble clic NO funciona en Chrome (bloquea la web por seguridad). Tiene que ser con un servidor local, por eso el paso de arriba.

## 2 · PROMPTS-Y-STORYBOARD (todos los prompts, para copiar)

Abre `storyboard.html` haciendo doble clic, ese sí funciona directo. Ahí tienes cada paso del vídeo: el prompt exacto a la izquierda, con botón de copiar, y el resultado real a la derecha. De la imagen ancla al ensamblaje explosionado, todo.

## 3 · INTERFACE-ATLAS-8-ESTILOS (de regalo)

AMPER usa skeuomorphism, pero hay 8 estilos más (glassmorphism, liquid glass, brutalism, claymorphism, minimalism, maximalism, neomorphism, spatial UI). Cada uno trae su guía de cuándo usarlo (`GUIAS-DE-DISENO.md`) y sus prompts de landing listos para pegar (`PROMPTS-LANDINGS.md`), con dos ejemplos ya montados para que veas el resultado.

---

**Recuerda: AMPER es un producto inventado**, se usó para enseñar el método. La técnica sirve igual con lo que tú vendas: sustituye el producto, el nombre y la marca por los tuyos, y sigue el mismo recorrido del storyboard.

Dudas o te atascas: te espero el domingo en la mentoría en directo.
