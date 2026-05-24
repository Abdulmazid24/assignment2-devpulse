# 🎤 Interview Video Presentation Script

ভাই, আপনার অ্যাসাইনমেন্টের ভিডিও প্রেজেন্টেশনের জন্য সবচেয়ে সহজ এবং ইমপ্রেসিভ ২টি প্রশ্নের উত্তর আমি নিচে সাজিয়ে দিয়েছি। আপনি ক্যামেরার সামনে এটা নিজের মতো করে (ন্যাচারালি) বলবেন।

## Question 1: What is the purpose of next() in Express middleware, and what happens if it is omitted in a route handler?

**How to answer (Speak naturally):**
"Hello everyone! To answer this question—in Express.js, the `next()` function is basically a bridge between middlewares. Express handles requests through a pipeline of middleware functions. When a middleware finishes its job, for example, checking if a user is authenticated, it calls `next()` to pass the control to the next middleware or the final route controller.

If we omit or forget to call `next()` inside a middleware, the request will hang. The client will keep waiting for a response, and eventually, it will time out because the server neither sent a response back nor passed the request to the next function. So, `next()` is absolutely critical for the request-response cycle to keep moving forward."

---

## Question 2: What is database connection pooling in PostgreSQL, and why is it preferred over opening a new client connection for every request?

**How to answer (Speak naturally):**
"Moving to the next question about Database Connection Pooling. In PostgreSQL, opening a new database connection for every single API request is very expensive and slow. It involves TCP handshakes, authentication, and memory allocation.

To solve this, we use a Connection Pool. A pool creates and maintains a set of ready-to-use, active connections in the background. When an API request comes in, it just borrows an existing connection from the pool, runs the query, and returns the connection back to the pool instead of closing it. 

This is highly preferred because it dramatically improves the application's performance, reduces latency, and prevents the database server from crashing due to too many simultaneous connection attempts. In our DevPulse project, we used `pg.Pool` to achieve exactly this."
