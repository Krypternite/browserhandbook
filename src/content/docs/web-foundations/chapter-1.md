---
title: Chapter 1:The Anatomy of a Web Navigation
description: Learn what happens from the moment a user enters a URL until pixels are rendered on the screen.
---
### *From URL String Parsing to Hardware Frame Rasterization*

When you type an address into a browser and press **Enter**, a distributed system spanning client-side process architectures, operating system kernels, cryptographic state machines, global network routing, and server application stacks executes in milliseconds.

This chapter breaks down every layer, process boundary, and memory state transition involved in bringing a web page to your screen.

---

## 1. Quick Reference & Performance Benchmarks

For quick scanning, here is how the entire execution sequence maps to browser performance metrics and latency targets:

| Phase | System / Subsystem | Primary Mechanism | Navigation Timing Metric | Target Latency |
|---|---|---|---|---|
| **1. Pre-Flight** | Browser Process (UI Thread) | URL parsing, HSTS evaluation, Resource Cache, Service Worker | `workerStart` | `< 1 ms` |
| **2. Address Resolution** | OS / Network Service | Cache traversal & Recursive DNS lookup | `domainLookupStart` / `domainLookupEnd` | `1 – 50 ms` |
| **3. Connection Setup** | OS Socket / Network Layer | TCP 3-Way Handshake & TLS 1.3 Negotiation | `connectStart` / `secureConnectionStart` | `20 – 100 ms` |
| **4. Server Execution** | Reverse Proxy / App Engine | Load balancing, Application logic, DB queries, Streaming response | `requestStart` / `responseStart` (TTFB) | `< 200 ms` |
| **5. Screen Rendering** | Renderer & GPU Processes | DOM/CSSOM construction, Layout, Pre-Paint, Tiling, Skia Raster | `domInteractive` / `domComplete` | **FCP:** `< 1.0s`<br>**LCP:** `< 2.5s` |

---

## 2. Component 1: URL Architecture & Formal Syntax

A **Domain Name** is simply a human-readable identifier for a network host. A **URL (Uniform Resource Locator)** is a complete specification defining *how* to access a specific resource on that host.

Per the **RFC 3986** specification, a URL follows a strict formal grammar:

$$\text{URI} = \text{scheme} \text{ ":" } \text{"//"} \text{ authority } \text{ path } [ \text{ "?" query } ] [ \text{ "\#" fragment } ]$$

### URL Breakdown

```
https://  user:pass@  sub.example.com  :443  /v1/products/  ?id=10&cat=2  #reviews
───┬───   ────┬────   ───────┬───────  ─┬──  ──────┬──────  ──────┬─────  ───┬───
Scheme     Userinfo        Host        Port     Path          Query     Fragment
```

* **Scheme (`https://`):** Case-insensitive protocol identifier registered with IANA. It determines which network handler and security rules the browser applies.
* **Userinfo (`user:pass@`):** Optional credentials for Basic Authentication. Modern browsers restrict or disable this in top-level navigation to prevent phishing.
* **Host (`sub.example.com`):** Registered domain name or literal IP address. Non-ASCII Unicode domain names (e.g., `münchen.de`) are converted by the browser into ASCII using the **Punycode algorithm** (`xn--mnchen-3ya.de`) per the IDNA 2008 standard.
  * **Subdomain:** `sub`
  * **Second-Level Domain (SLD):** `example`
  * **Top-Level Domain (TLD):** `.com`
* **Port (`:443`):** Network endpoint gate on the host. If omitted, the browser defaults to `80` for HTTP and `443` for HTTPS.
* **Path (`/v1/products/`):** Hierarchical route used by the server application to identify the target resource.
* **Query Parameters (`?id=10&cat=2`):** Non-hierarchical key-value pairs starting with `?`. They pass runtime parameters or state filters to the backend application.
* **Fragment Identifier (`#reviews`):** Client-side target starting with `#`. **Fragments are never transmitted to the server in HTTP requests.** Once the document is rendered, the browser scrolls directly to the HTML element matching `id="reviews"`.

---

## 3. High-Level Navigation Flow Architecture

The end-to-end journey moves through five distinct phases across system boundaries:

```
[ Address Bar: User Presses Enter ]
                │
                ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ PHASE 1: URL Parsing, HSTS, & Cache Pre-Checks                           │
│ • Browser Process checks HSTS preload list                               │
│ • Memory Cache ──► Disk Cache ──► Service Worker Interception            │
└────────────────────────────────────┬─────────────────────────────────────┘
                                     │
                                     ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ PHASE 2: Address Resolution (DNS Lookup)                                 │
│ • Local Check: Browser Cache ──► OS Cache / Hosts ──► Router ──► ISP     │
│ • Hierarchy: Root Server (.) ──► TLD Server (.com) ──► Authoritative DNS │
└────────────────────────────────────┬─────────────────────────────────────┘
                                     │
                                     ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ PHASE 3: Network Connection & Security Setup                             │
│ • TCP 3-Way Handshake: SYN ──► SYN-ACK ──► ACK                           │
│ • TLS 1.3 Handshake: ClientHello ──► ServerHello/Cert ──► Session Keys   │
└────────────────────────────────────┬─────────────────────────────────────┘
                                     │
                                     ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ PHASE 4: HTTP Request & Backend Processing                               │
│ • Issue HTTP GET request with headers, cookies, and tokens               │
│ • Reverse Proxy (NGINX) ──► App Server ──► Database Query ──► Response   │
└────────────────────────────────────┬─────────────────────────────────────┘
                                     │
                                     ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ PHASE 5: Multi-Process Browser Rendering Pipeline                         │
│ • IPC Hand-off: Network Service ──► Renderer Process via Mojo IPC         │
│ • Main Thread: Preload Scanner ──► DOM/CSSOM ──► Layout ──► Pre-Paint    │
│ • Compositor & GPU: Layer Tiling ──► Skia Rasterization ──► Display       │
└────────────────────────────────────┬─────────────────────────────────────┘
```

---

## 4. Phase 1: URL Parsing, HSTS, & Local Caching

When **Enter** is pressed, execution begins inside the **Browser Process UI Thread**.

```
                 [ User Input in Address Bar ]
                               │
                               ▼
                [ Sanitize & Parse Input ]
                               │
                               ▼
               [ Check HSTS Preload Table ]
                   ├── (Matched: Upgrade to HTTPS locally)
                   └── (Not Matched: Keep scheme)
                               │
                               ▼
            [ Service Worker Interception Check ]
                   ├── (Active SW: Fire 'fetch' event)
                   └── (No SW: Continue to HTTP Cache)
                               │
                               ▼
             [ HTTP Resource Cache Inspection ]
                   ├── Memory Cache (RAM)
                   └── Disk Cache (Storage)
```

### Step 1: Input Disambiguation
The UI thread evaluates whether the entered text is a valid URL or a search query.
* If the string lacks a valid protocol/TLD or contains spaces (e.g., `how to learn angular`), it is rewritten into a search URL (e.g., `https://www.google.com/search?q=...`).
* If it is a valid URL, characters are normalized and encoded (percent-encoding).

### Step 2: HSTS Preload Enforcement
The browser checks its hardcoded **HTTP Strict Transport Security (HSTS)** preload list.
* If the domain is present, the browser automatically rewrites `http://` to `https://` before sending any network packets. This eliminates vulnerability to man-in-the-middle SSL-stripping attacks.

### Step 3: Service Worker Interception
If a Service Worker is registered for the origin:
* The Network Service passes the request into the Service Worker thread, firing a `fetch` event.
* The Service Worker can intercept the request and immediately return a custom response from its own `CacheStorage` API, or let the request pass through to the network.

### Step 4: HTTP Resource Caching
If not handled by a Service Worker, the browser inspects its internal cache tiers using a lookup key (`Origin + HTTP Method + URL`):
1. **Memory Cache (RAM):** Extremely fast, short-lived storage tied to the current process navigation lifetime.
2. **Disk Cache (Storage):** Persistent file storage managed by the browser engine.

The browser evaluates response directives from previous visits:
* `Cache-Control: no-store`: Do not store or serve from cache. Proceed to network.
* `Cache-Control: no-cache`: Must revalidate with the server using `ETag` (`If-None-Match`) or `Last-Modified` (`If-Modified-Since`) before serving.
* `Cache-Control: max-age=N`: If elapsed time $< N$, the browser immediately returns `200 OK (from memory cache)` or `200 OK (from disk cache)`, bypassing the network entirely.

---
## Phase 1.5: Browser Cache Lookup

Before performing any network operation, the browser first checks whether it already has the requested resource available locally.

```
User enters URL
        │
        ▼
Memory Cache
        │
        ▼
Disk Cache
        │
        ▼
Service Worker
        │
        ▼
HTTP Cache
        │
        ▼
Network
```

### Memory Cache

Memory Cache stores resources for the lifetime of the current browser tab.

Examples include:

- JavaScript bundles
- CSS files
- Images
- Fonts

If the requested resource exists here and is still valid, the browser can use it immediately without any network activity.

---

### Disk Cache

If the resource is not found in memory, the browser checks the Disk Cache.

Unlike Memory Cache, Disk Cache persists across browser sessions.

The browser determines whether a cached resource is still valid using HTTP caching headers such as:

- Cache-Control
- Expires
- ETag
- Last-Modified

If valid, the browser avoids downloading the resource again.

---

### Service Worker Cache

If the page is controlled by a Service Worker, it receives the request before the browser accesses the network.

```
Browser Request

        │

        ▼

Service Worker

        │

   ┌────┴─────┐
   │          │
Return Cache  Fetch Network
```

This mechanism enables:

- Offline applications
- Background synchronization
- Custom caching strategies
- Progressive Web Apps (PWAs)

---

### Why This Matters

Every successful cache lookup avoids expensive operations such as:

- DNS resolution
- TCP handshake
- TLS negotiation
- HTTP request
- Server processing

Caching is therefore one of the biggest contributors to good web performance.
---
## 5. Phase 2: Domain Name Resolution (DNS)

If the resource is uncached, the browser must convert the domain name into an IP address (e.g., `93.184.216.34`).

```
[ Browser DNS Cache ] ──► [ OS Cache / Hosts File ] ──► [ Router Cache ] ──► [ ISP Recursive Resolver ]
                                                                                   │
                                                                                   ▼
[ Authoritative Server ] ◄── [ TLD Server (.com) ] ◄── [ Root DNS Server (.) ] ───┘
```

### Step 1: Local Cache Traversal
The resolution query checks local storage layers in order:
1. **Browser DNS Cache:** Internal DNS table stored in browser memory.
2. **OS Cache & Hosts File:** Operating system DNS cache and manual overrides listed in `/etc/hosts` (Unix) or `C:\Windows\System32\drivers\etc\hosts` (Windows).
3. **Router Cache:** Cache maintained by the local network router.

### Step 2: Recursive DNS Traversal
If all local caches miss, the query hits the **ISP Recursive Resolver** (or public resolvers like Cloudflare `1.1.1.1` or Google `8.8.8.8`). The resolver executes a recursive resolution chain:

1. **Root Nameserver (`.`):** Receives the query and responds with the IP address of the Top-Level Domain (TLD) server responsible for `.com`.
2. **TLD Nameserver (`.com`):** Receives the query and responds with the IP address of the Authoritative Nameserver for `example.com`.
3. **Authoritative Nameserver:** Holds the official DNS records (A/AAAA records). It returns the final IP address along with a **Time-To-Live (TTL)** value specifying how long the result can be cached.

# Modern Browser Connection Optimizations

Modern browsers attempt to reduce network latency before requests are even made.

## DNS Prefetch

DNS Prefetch resolves domain names before they are required.

```html
<link rel="dns-prefetch" href="//fonts.googleapis.com">
```

When the resource is eventually requested, the browser already knows its IP address.

---

## Preconnect

Preconnect establishes the network connection before the browser actually requests the resource.

It performs:

- DNS Lookup
- TCP Handshake
- TLS Handshake

```html
<link rel="preconnect" href="https://fonts.gstatic.com">
```

This significantly reduces connection setup time.

---

## Preload

Preload informs the browser that a resource is critical and should be downloaded immediately.

```html
<link
    rel="preload"
    href="/hero.webp"
    as="image"
    fetchpriority="high">
```

Typical preload candidates include:

- Hero images
- Fonts
- Critical CSS
- JavaScript entry bundles

---

## Prefetch

Prefetch downloads resources that are likely to be required in the future.

Examples include:

- Next page navigation
- Future route bundles
- Product pages
- Search results

Unlike Preload, Prefetch is considered a low-priority optimization.

---

## 6. Phase 3: Network Connection & Security Handshakes

With the IP address known, the Network Service opens a socket connection to target port `443`.

### 1. TCP 3-Way Handshake
To establish reliable, ordered data transfer over Transmission Control Protocol:

```
CLIENT                                           SERVER
  │                                                │
  │ ─── SYN (Seq=X) ─────────────────────────────► │  1. Client requests connection
  │                                                │
  │ ◄── SYN-ACK (Seq=Y, Ack=X+1) ───────────────── │  2. Server acknowledges & requests
  │                                                │
  │ ─── ACK (Ack=Y+1) ───────────────────────────► │  3. Client confirms connection
  │                                                │
```

1. **SYN:** Client sends a TCP packet with a random sequence number $X$ and the `SYN` flag set.
2. **SYN-ACK:** Server responds with its own sequence number $Y$, sets the `SYN` flag, and acknowledges $X+1$ with the `ACK` flag.
3. **ACK:** Client confirms by sending an `ACK` packet with acknowledgment $Y+1$. Connection status transitions to `ESTABLISHED`.

### 2. TLS 1.3 Encryption Handshake
Once TCP is established, Transport Layer Security (TLS 1.3) encrypts the communication channel:

```
CLIENT                                           SERVER
  │                                                │
  │ ─── ClientHello ─────────────────────────────► │  • Supported Ciphers
  │     + Key Share (Diffie-Hellman)               │  • Client Key Exchange Parameter
  │                                                │
  │ ◄── ServerHello ────────────────────────────── │  • Selected Cipher
  │     + Key Share + Server Certificate           │  • Server Key Exchange Parameter
  │     + EncryptedExtensions + Finished           │  • CA Certificate Validation
  │                                                │
  │ ─── Finished ────────────────────────────────► │  • Symmetric Session Keys Active
  │                                                │
```

1. **ClientHello:** The browser sends supported TLS versions, cipher suites, and a cryptographic key exchange parameter (Diffie-Hellman share).
2. **ServerHello & Certificate:** The server selects the cipher suite, responds with its key share, sends its digital certificate issued by a trusted Certificate Authority (CA), and completes its side of the handshake.
3. **Key Derivation & Finished:** Both parties independently calculate matching symmetric encryption keys using the exchanged parameters. All subsequent payload traffic is encrypted with these session keys.


# Connection Reuse

Creating a TCP connection and performing a TLS handshake are expensive operations.

Modern browsers therefore try to reuse existing connections whenever possible.

```
First Request

↓

TCP

↓

TLS

↓

Connection Established

↓

Request 2

↓

Reuse Existing Connection

↓

Request 3

↓

Reuse Existing Connection
```

HTTP/2 and HTTP/3 are specifically designed to maximize connection reuse.

Benefits include:

- Lower latency
- Reduced CPU usage
- Fewer handshakes
- Faster page loads
---

## 7. Phase 4: HTTP Request & Backend Processing

```
HTTP Request ──► [ Reverse Proxy / Load Balancer ]
                          │
                          ▼
                 [ Web Application ] ──► [ Database / Cache Tiers ]
                          │
                          ▼
HTTP Response ◄── [ Content Generation (200 OK + HTML Byte Stream) ]
```

### Step 1: Transmitting the HTTP Request
The browser sends an HTTP request (typically HTTP/2 or HTTP/3 over QUIC) containing:
* **Request Line:** `GET /v1/products/ HTTP/2`
* **Headers:** `Host: www.example.com`, `User-Agent`, `Accept`, `Accept-Encoding: gzip, br`
* **Cookies:** Authentication tokens or session IDs stored for this origin.

### Step 2: Infrastructure & Reverse Proxy Handling
1. **Edge/CDN Layer:** Incoming traffic hits a CDN or Load Balancer (e.g., Cloudflare, NGINX, AWS ALB).
2. **TLS Termination:** The reverse proxy decrypts the incoming traffic and forwards the request over high-speed internal networks to the application server.

### Step 3: Server-Side Execution
1. **Routing & Middleware:** The application framework matches the path `/v1/products/` to a controller function, validating session cookies and permissions.
2. **Database Queries:** The app queries datastores (e.g., PostgreSQL, Redis) to retrieve required content.
3. **Response Assembly:** The backend renders HTML or fetches cached templates, builds HTTP response headers (`Content-Type: text/html`, `Set-Cookie`, `Cache-Control`), and returns a `200 OK` response stream.
4. **TTFB (Time to First Byte):** The duration from when the browser initiated the request until it receives the very first byte of response data from the server.



# CDN (Content Delivery Network)

Many websites are not served directly from the origin server.

Instead, requests are routed through a Content Delivery Network (CDN).

```
Browser

        │

        ▼

CDN Edge Server

        │

   Cache Hit?

   ┌────┴─────┐

Yes          No

 │            │

Return      Origin Server

Content       │

              ▼

       Generate Response
```

Popular CDN providers include:

- Cloudflare
- Akamai
- Fastly
- Amazon CloudFront

Benefits include:

- Reduced latency
- Lower origin server load
- Better global performance
- Improved Core Web Vitals


---

## 8. Phase 5: Browser Rendering Pipeline Internals

As raw HTML bytes flow back over the network socket, the browser hands off execution to rendering engine processes.

# Renderer Threads

A Renderer Process is itself multi-threaded.

```
Renderer Process

├── Main Thread
│
├── Compositor Thread
│
├── Raster Threads
│
├── Dedicated Worker Threads
│
├── Shared Worker Threads
│
└── Audio Thread
```

### Main Thread

Responsible for:

- HTML Parsing
- DOM
- CSSOM
- JavaScript Execution
- Layout
- Event Handling

### Compositor Thread

Responsible for:

- Layer management
- Smooth scrolling
- Animation scheduling
- Frame submission

### Raster Threads

Convert paint instructions into bitmap tiles.

### Worker Threads

Execute JavaScript without blocking the Main Thread.

Workers cannot directly access the DOM.

### Multi-Process Rendering Architecture

```
+-------------------------------------------------------------------------+
| BROWSER PROCESS                                                         |
|  • UI Thread: Handles address bar, tabs, and user input                 |
|  • Network Thread: Manages sockets, protocol stacks, and byte streams   |
+------------------------------------+------------------------------------+
                                     │ IPC / Mojo Data Pipe
                                     ▼
+-------------------------------------------------------------------------+
| RENDERER PROCESS                                                        |
|  • Main Thread: HTML Parser ──► Preload Scanner ──► DOM/CSSOM ──► Layout |
|  • Compositor Thread: Layer Allocation ──► Tile Management              |
+------------------------------------+------------------------------------+
                                     │ IPC / Viz
                                     ▼
+-------------------------------------------------------------------------+
| GPU PROCESS                                                             |
|  • Viz Thread: Translates draw commands ──► Skia/Vulkan ──► Display    |
+-------------------------------------------------------------------------+
```
# Navigation Timing API Mapping

Every major phase of navigation is exposed through the Navigation Timing API.

| Browser Phase | Timing API |
|---------------|------------|
| DNS Lookup | domainLookupStart → domainLookupEnd |
| TCP Connection | connectStart → connectEnd |
| TLS Handshake | secureConnectionStart |
| HTTP Request | requestStart |
| First Byte | responseStart |
| Response Complete | responseEnd |
| DOM Parsing | domInteractive |
| DOM Ready | DOMContentLoaded |
| Page Loaded | loadEventEnd |

These timestamps are visible in Chrome DevTools and can also be accessed programmatically using the Performance API.

### Step-by-Step Render Execution

```
HTML Bytes ──► Tokenization ──► DOM Tree Construction
                                       │
CSS Bytes  ──► Rule Parsing ──► CSSOM Tree Construction
                                       │
                                       ▼
                             RenderTree Generation
                                       │
                                       ▼
                                 Layout Engine
                   (Computes Geometry: x, y, width, height)
                                       │
                                       ▼
                             Pre-Paint & Display Ops
                                       │
                                       ▼
                            Compositor Layer Tiling
                                       │
                                       ▼
                             GPU Skia Rasterization
                                       │
                                       ▼
                              Physical Frame Output
```

#### 1. DOM Tree Construction & The Preload Scanner
* **HTML Parser:** Converts incoming UTF-8 byte streams into characters, then tokens, then structural **DOM Nodes**, building the **DOM Tree**.
* **Preload Scanner:** A lightweight secondary thread scans the HTML stream ahead of the main parser. If it discovers external resources (`<script>`, `<link rel="stylesheet">`, `<img>`), it immediately fires off high-priority background network requests before the main parser even reaches them.

#### 2. CSSOM & Parser Blocking Scripts
* **CSSOM Construction:** The parser processes CSS rules into the **CSS Object Model (CSSOM)** tree. CSS is **render-blocking**—the browser will not render visible pixels until the CSSOM is completely built.
* **JavaScript Execution:** Synchronous `<script>` tags are **parser-blocking**. When encountered, HTML parsing halts until the script is fetched, parsed, and executed, because JavaScript can mutate the DOM via `document.write()` or DOM APIs. (Using `async` or `defer` attributes prevents this blocking behavior).

#### 3. RenderTree Creation & Layout
* **RenderTree:** The browser combines the DOM and CSSOM into a **RenderTree**. Nodes set to `display: none` or non-visual tags (`<head>`) are excluded.
* **Layout Phase (Reflow):** The Layout Engine traverses the RenderTree and calculates the exact geometric position and bounding box dimensions ($x, y$, width, height) for every visible element on the screen relative to the viewport.

#### 4. Pre-Paint & Paint Property Trees
* **Pre-Paint:** Generates property trees (transforms, opacity, spatial clips, and scrolling info) separately from layout so the compositor can run animations smoothly.
* **Paint Phase:** Creates a chronological list of visual drawing operations (**PaintOps**), such as "draw rectangle at $(x,y)$", "draw text string", or "fill background color".

#### 5. Compositing, Tiling, & GPU Rasterization
* **Compositing:** To avoid repainting the whole page during scrolls or animations, the Compositor Thread breaks the page into separate visual layers.
* **Tiling:** Layers are broken down into smaller memory tiles.
* **GPU Rasterization:** Raster Worker threads send these tiles to the **GPU Process**. The GPU uses graphics libraries (**Skia**, **Vulkan**, or **DirectX**) to translate drawing commands into hardware pixel textures, presenting the final composite frame to the physical display monitor via `SwapBuffers`.

---

# Complete End-to-End Browser Lifecycle

```
User Types URL
        │
        ▼
URL Parsing
        │
        ▼
Memory Cache
        │
        ▼
Disk Cache
        │
        ▼
Service Worker
        │
        ▼
DNS Lookup
        │
        ▼
TCP Handshake
        │
        ▼
TLS Handshake
        │
        ▼
HTTP Request
        │
        ▼
CDN
        │
        ▼
Origin Server
        │
        ▼
Streaming HTML
        │
        ▼
HTML Parser
        │
        ▼
Preload Scanner
        │
        ▼
DOM
        │
        ▼
CSSOM
        │
        ▼
Render Tree
        │
        ▼
Layout
        │
        ▼
Paint
        │
        ▼
Rasterization
        │
        ▼
Compositing
        │
        ▼
GPU Rendering
        │
        ▼
Pixels Displayed
```

## Browser's Primary Goal

Throughout this lifecycle, the browser continuously attempts to answer one question:

> **"Can this work be avoided, delayed, reused, or performed in parallel?"**

Every browser optimization—including caching, connection reuse, streaming, preloading, speculative fetching, and compositing—is designed to reduce latency and minimize unnecessary work.

Understanding this principle provides the foundation for understanding Core Web Vitals, browser performance, and frontend optimization.
---

## 9. Performance Metrics & Mapping

Connecting these architectural phases directly to Chrome DevTools and Core Web Vitals performance benchmarks:

```
[Navigation Initiated]
        │
        ├──► workerStart ───────────── (Phase 1: Service Worker / Cache Check)
        │
        ├──► domainLookupStart/End ─── (Phase 2: DNS Resolution)
        │
        ├──► connectStart/End ──────── (Phase 3: TCP Handshake)
        │
        ├──► secureConnectionStart ─── (Phase 3: TLS Negotiation)
        │
        ├──► requestStart ──────────── (Phase 4: HTTP Request Sent)
        │
        ├──► responseStart (TTFB) ───── (Phase 4: First Byte Received from Server)
        │
        ├──► domInteractive ────────── (Phase 5: DOM Tree Constructed)
        │
        ├──► First Contentful Paint ── (Phase 5: First Pixel Rendered on Screen)
        │
        └──► Largest Contentful Paint  (Phase 5: Main Content Rendered & Visible)
```

### Core Web Vitals Metrics Targets
* **Time to First Byte (TTFB):** Measures backend speed and network latency. **Target: $< 200\text{ ms}$**.
* **First Contentful Paint (FCP):** Marks the moment the browser renders the first piece of DOM content (text, image, or canvas). **Target: $< 1.0\text{ s}$**.
* **Largest Contentful Paint (LCP):** Marks the moment the primary hero content of the page is fully rendered and visible in the viewport. **Target: $< 2.5\text{ s}$**.


---

# Streaming HTML

Modern web servers often stream HTML instead of waiting for the complete document to be generated.

```
Server

↓

First HTML Chunk

↓

Browser Starts Parsing

↓

More HTML Arrives

↓

Continue Parsing

↓

Render Incrementally
```

Streaming improves perceived performance because the browser can begin parsing, downloading resources, and rendering before the server finishes generating the complete page.

Modern frameworks such as React Server Components and Next.js Streaming make extensive use of this capability.
