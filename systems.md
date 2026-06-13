# Distributed Systems Roadmap — Enhanced
For someone coming from fullstack, heading to Bloomberg Engineering.

Each topic has three things:
  Ask Claude  — a prompt to paste into a new chat for a deep explanation
  Read        — the one or two best sources, nothing extra
  Build       — a concrete project or exercise to make it stick

One book to buy: Designing Data-Intensive Applications by Martin Kleppmann (DDIA).
Chapters are referenced throughout. There's no substitute for it.

---

> Dependency-ordered. Don't skip a stage. Within a stage, go parallel where noted.  
> Each topic has: an Ask Claude prompt, reading materials, and a hands-on project.

## Dependency Map (quick reference)

```
0. Single-Machine Basics (The Root)
          ↓
1. Distributed Hard Problems
       /  |  \
      /   |   \
     /    |    \
    ↓     ↓     ↓
2. Data  3. Msg  4. Infra      ← all three tracks in parallel
    \     /       |
     ↓   ↓        |
5. Patterns       |
      \           /
       ↓         ↓
  6. System Design Practice
```

---

## Stage 0 — Single-Machine Fundamentals (The Root)

Before you think about distributing anything, close the gaps fullstack
development tends to leave in how machines and I/O actually work.

---

### The latency numbers

Ask Claude:
"I'm a fullstack developer learning systems performance. Explain the memory
and storage hierarchy: L1/L2/L3 cache, RAM, SSD, and network — what each
is, how fast it is, and why the difference matters. Give me 5 real engineering
decisions (caching, batching, serialization, etc.) that exist specifically
because of these latency gaps. Use concrete numbers."

Read:
https://gist.github.com/jboner/2841832
Save this. Reference it whenever you're making an architectural decision.

Build:
Take any app you've built. List every place you make a database call, an API
call, or a cache read. Annotate each with the latency tier it falls into
(RAM, SSD, network same-DC, etc.). Then identify which ones are in a hot path
and what that costs. No code — just annotate and think.

---

### I/O models: blocking, non-blocking, async

Ask Claude:
"I know async/await from JavaScript and Python but don't understand what's
happening underneath. Explain blocking I/O, non-blocking I/O, and async
event-driven I/O from first principles. Show how each handles 100 concurrent
connections differently using a simple example. Explain why Nginx chose an
event loop over a thread-per-connection model, and what 'context switching
overhead' actually means."

Read:
https://www.nginx.com/blog/inside-nginx-how-we-designed-for-performance-scale/
One article. Explains the event loop choice with real architecture reasoning.

Build:
Write a TCP echo server in Python twice. First with the `socket` module
(blocking, one thread per connection). Then with `asyncio` (event-driven).
Use `hey` or `hurl` to hit both with 200 concurrent connections and compare
how they behave when connections pile up. The failure mode of the blocking
version is the lesson.

---

### How databases store data (B-trees vs LSM trees)

This is context for Stage 2. You don't need to go deep here — just build
the mental model.

Ask Claude:
"Explain how Postgres stores data on disk using B-trees and how databases
like Cassandra and RocksDB store data using LSM trees. Cover: how a write
works in each model, how a read works, what 'compaction' is and why LSM
trees need it, and what the read amplification vs write amplification
tradeoff means in practice. Assume I know basic data structures."

Read:
DDIA Chapter 3 — read up to "Transaction Processing or Analytics."

Build:
Nothing hands-on needed yet. After reading, write a one-paragraph answer
to: "If I'm building a system that does 100k writes/sec and relatively few
reads, which storage engine model would I prefer and why?" Keep it to
yourself for now — revisit it in Stage 2 after you've used Postgres and
looked at Cassandra.

---

## Stage 1 — Distributed Systems Hard Problems (Depends on Stage 0)

The conceptual foundation of everything that follows. Take 3 weeks here,
not 1. The people who rush this phase learn the tools without understanding
why they're designed the way they are.

---

### Partial failures

The single most important thing to internalize in this entire roadmap.

Ask Claude:
"Walk me through why partial failures are the core problem in distributed
systems. Give me 5 concrete scenarios where a network call between two
services produces an ambiguous result — not a clean success or failure.
For each scenario: what does the caller know, what can't it know, and what
should it do? Also explain what idempotency is and why it's the standard
solution to handling retries safely. Use an order submission service as
the example."

Read:
DDIA Chapter 8 — "The Trouble with Distributed Systems."
Read it slowly. This chapter changes how you think about every network call.

Build:
Write an HTTP client function that calls an endpoint and handles all 5
failure modes: clean error response, timeout (request never arrived), timeout
(request arrived but response was lost), server crash mid-processing, and
successful response after your retry already ran. Include idempotency keys
on mutating requests. This is not a fancy project — it's ~50 lines. The
point is thinking through every case explicitly.

---

### Clocks and ordering

Ask Claude:
"Explain why distributed systems can't use wall clocks to determine the
order of events. Cover: what clock drift is and why NTP doesn't fully fix
it, what happens when two services use timestamps to determine which write
wins (give a scenario where it goes wrong), and how Lamport clocks provide
a logical ordering of events without relying on physical time. Keep it
intuitive — I don't need formal proofs, I need to understand when I should
and shouldn't trust a timestamp."

Read:
DDIA Chapter 8 covers clocks (part of the same chapter as partial failures).
If you want more depth: https://martinfowler.com/articles/patterns-of-distributed-systems/lamport-clock.html

Build:
No project here. Instead: find a real bug. Look at any distributed system
you've worked on or know about where timestamps were used for ordering.
Think through whether clock skew could cause a correctness issue. If you
can't find one in your own code, think through what would happen if two
Bloomberg terminals submitted a conflicting order update within 1ms of
each other and the system used timestamps to pick the winner.

---

### Replication

Ask Claude:
"Explain how database replication works, starting with single-leader
replication. Cover: how a follower stays in sync with the leader, what
replication lag is and what it means for someone reading from a follower,
what split-brain is and why it's dangerous, how leader election works when
the leader crashes (at a high level), and what 'synchronous vs asynchronous
replication' means for the durability vs performance tradeoff. Use Postgres
streaming replication as the concrete reference."

Read:
DDIA Chapter 5. All of it. Best thing written on the topic.
Then skim: https://www.postgresql.org/docs/current/warm-standby.html
to see how the theory maps to actual Postgres configuration.

Build:
Set up Postgres with a streaming replica in Docker Compose (2 containers:
primary + replica, replication configured). Write some rows to the primary.
Query the replica immediately and observe lag. Pause the replica, write more
rows to the primary, resume the replica, and watch it catch up. Then: kill
the primary. Observe what the replica does. This is replica promotion in
practice.

---

### Consistency models

Ask Claude:
"I keep hearing 'strong consistency', 'eventual consistency', 'linearizability',
and 'CAP theorem' but they blur together. Explain each with a concrete example
of a situation where it's acceptable and one where it's not. Specifically:
why is eventual consistency fine for a social media feed but not for a bank
balance? What does linearizability actually guarantee that eventual consistency
doesn't? And what does CAP theorem actually say — including what it doesn't
say and why it's often misapplied in practice?"

Read:
DDIA Chapter 9 (first half, up to "Ordering Guarantees").
Then this short post by the same author that corrects common misunderstandings:
https://martin.kleppmann.com/2015/05/11/please-stop-calling-databases-cp-or-ap.html

Build:
No code. Design exercise: for each of these systems, decide what consistency
model is acceptable and write one sentence justifying it.
  - Bloomberg terminal showing a stock price
  - Bloomberg order submission (placing a trade)
  - User profile / preferences
  - A rate limiter deciding whether to allow a request
  - A news article being indexed for search

---

### Consensus (Raft)

Ask Claude:
"Explain the Raft consensus algorithm as if I'm a developer who has never
worked on distributed systems. Walk me through: how leader election works
(what triggers it, how a winner is decided), how log replication works
(what happens between a client write and a committed response), what a
quorum is and why a majority matters, and what happens during a network
partition where nodes can't communicate. Then tell me which real systems
use Raft and where I'd encounter it at a company using Kubernetes."

Read:
The Raft paper sections 1–5 (it's actually readable):
https://raft.github.io/raft.pdf
The animated visualization — spend 10 minutes playing with it:
https://raft.github.io/

Build:
Use the Raft visualization. Manually stop nodes and observe what happens:
Kill the leader — watch election happen. Kill enough followers to lose
quorum — watch writes stop. Bring nodes back — watch log reconciliation.
Write a short paragraph describing what happened in each case.
If you want to go deeper: https://pdos.csail.mit.edu/6.824/labs/lab-raft.html
(MIT 6.824 Raft lab in Go — one weekend, very worth it if you have time.)

---

## Stage 2 — Scaling Data (Parallel Track, Depends on Stage 1)

---

### Partitioning (sharding)

Ask Claude:
"Explain data partitioning for distributed databases. Cover: range
partitioning vs hash partitioning — what each is and the real tradeoffs
(don't just say 'hotspots are bad', explain when a hotspot actually happens
with hash partitioning too). Then explain consistent hashing: what problem
it solves over naive hash partitioning when nodes are added or removed,
and what virtual nodes are and why they improve balance. Use a stock ticker
dataset as the running example — instrument names as the key."

Read:
DDIA Chapter 6.
Then this for a visual on consistent hashing:
https://arpitbhayani.me/blogs/consistent-hashing

Build:
Implement consistent hashing with virtual nodes in Python. It should:
- Place N nodes on a ring with V virtual nodes each
- Given a key, find which node owns it
- Support adding a new node and report what fraction of keys move
- Support removing a node and do the same

Target: ~60 lines. Don't look at implementations until you've tried.
The point of this exercise is watching how little data moves when you
add/remove a node vs naive modulo hashing.

---

### SQL at scale

Ask Claude:
"I use SQL daily but don't think about performance. Teach me how to think
like a database engine. Cover: how a B-tree index works and why column
order in a composite index matters, how to read EXPLAIN ANALYZE output in
Postgres (give me a sample query and walk through the output line by line),
what 'index-only scan' vs 'index scan' vs 'seq scan' means and when each
happens, and why opening 10,000 connections to Postgres is a problem and
what PgBouncer does to fix it."

Read:
https://use-the-index-luke.com/ — Parts 1 and 2.
This is a free book. It's the best SQL performance resource available.

Build:
Create a Postgres table with 1 million rows (use `pgbench -i` or generate
with a script). Write three queries that do full sequential scans. Run
EXPLAIN ANALYZE on each, copy the output. Now add indexes. Run again.
Compare the output before and after — specifically look at the cost
estimates and actual row counts. Then try a query the index doesn't help
and understand why.

---

### Caching

Ask Claude:
"Teach me caching as an engineer, not from a textbook. Cover: cache-aside
vs write-through vs write-back — give me a concrete scenario where each
is the right choice and what breaks if you pick the wrong one. Explain
cache invalidation: why is it hard? Give me a real scenario where a cache
gets stale and causes a correctness bug. Explain cache stampede: what
causes it and two ways to prevent it. Finally, cover Redis data structures
beyond key-value: when would I use a sorted set vs a stream?"

Read:
Redis data types: https://redis.io/docs/data-types/
(Read the sorted set and stream sections specifically.)

Build:
Two things:

1. Cache-aside: wrap a slow Postgres query with Redis caching. Add TTL.
   Measure the difference in response time on first hit vs cached hit.

2. Stampede fix: expire a hot key, send 50 concurrent requests simultaneously
   (use threading or async). Observe how many hit Postgres. Then implement
   a Redis-based lock so only one request rebuilds the cache. Run again.
   Observe the difference.

---

## Stage 3 — Messaging & Event-Driven Systems (Parallel Track, Depends on Stage 1)

Bloomberg's data is fundamentally event-driven. Prices change, orders fill,
news breaks — these are events happening in real time. This stage directly
maps to how Bloomberg's data pipelines are architected.

---

### Message queues vs event logs

Ask Claude:
"Explain the conceptual difference between a message queue like RabbitMQ
and an event log like Kafka. Use a concrete order management system as the
example — an order is placed, risk is checked, it's sent to the exchange,
the fill is received. For this workflow, show me how it would look with a
queue and how it would look with an event log. What does 'the log is the
source of truth' mean, and why is that a powerful design principle?"

Read:
Jay Kreps (Kafka's creator) — "The Log: What every software engineer should
know about real-time data's unifying abstraction." Long, but it's the essay
that explains why Kafka is designed the way it is:
https://engineering.linkedin.com/distributed-systems/log-what-every-software-engineer-should-know-about-real-time-datas-unifying

Build:
Read the essay. No code for this topic. The essay is the exercise.

---

### Kafka — the internals

Ask Claude:
"Teach me Kafka's internals as a developer who needs to use it correctly,
not just use the API. Walk me through topics, partitions, and offsets using
a text diagram showing what the physical log looks like. Explain: how a
consumer group works and what happens when a consumer joins or crashes
(rebalancing), what ISR means and how the 'acks' setting affects durability
vs throughput, what 'exactly-once' means and the cost of achieving it vs
'at least once with idempotent consumers', and how log compaction differs
from retention and when you'd use it. Use a market data feed as the example."

Read:
Kafka's official design documentation — the actual rationale, not tutorials:
https://kafka.apache.org/documentation/#design
DDIA Chapter 11 (Stream Processing) — read this before writing Kafka code.

Build:
Run Kafka in Docker (use docker-compose with one Zookeeper + one broker to
start). Then:
- Write a producer that sends 50,000 events to a topic with 6 partitions
- Write 3 consumers in one consumer group — observe partition assignment
- Kill one consumer mid-run — observe rebalancing and where it resumes
- Start a second consumer group on the same topic — observe it reads
  independently from the beginning (set auto.offset.reset=earliest)

The goal is seeing partition assignment, rebalancing, and independent
consumer groups behave live.

---

### Stream processing

Ask Claude:
"Explain stream processing to someone who understands batch processing.
Start with why batch isn't enough (latency). Then explain: event time vs
processing time — why they differ and give a market data example where
using the wrong one produces wrong results. Explain windowing: tumbling,
sliding, and session windows with concrete use cases for each. Explain
what a watermark is and why you need one to handle late-arriving events.
Finally compare Kafka Streams (library) vs Apache Flink (engine) — when
does each make sense?"

Read:
"The world beyond batch: Streaming 101" by Tyler Akidau (Flink/Beam co-creator).
Read both parts. This is the definitive explanation of event time and watermarks:
https://www.oreilly.com/radar/the-world-beyond-batch-streaming-101/

Build:
Using Kafka Streams (Java) or Flink (Python via PyFlink):
Compute a 1-minute tumbling window count of events per stock symbol
from a simulated market data topic. Then switch to a 1-minute sliding
window with a 30-second slide. Observe how the output changes. Then
introduce late events (manually produce a message with an old timestamp)
and see what the windowing system does with it.

---

## Stage 4 — Infrastructure You'll Actually Encounter (Parallel Track, Depends on Stage 1)

You won't manage the cluster. But you'll deploy to one, debug services
running in it, and need to understand why things behave the way they do.

---

### Load balancing

Ask Claude:
"Explain load balancing from the ground up. What problem does it solve
and what happens without it? What's the difference between L4 and L7
load balancing, and when do you choose each? Walk me through round-robin,
least-connections, and consistent hashing as balancing algorithms with
the failure mode of each. What are health checks, how do they work, and
what's the correct behavior when a backend fails one? What is connection
draining and why do you need it for zero-downtime deployments?"

Read:
This interactive visual — actually use the sliders, don't just read:
https://samwho.dev/load-balancing/

Build:
Docker Compose: Nginx as L7 load balancer in front of 3 instances of a
simple HTTP service (can be a one-file Python Flask app that returns its
hostname). Configure health checks. Send 1000 requests and confirm
distribution. Then kill one container — verify Nginx stops routing to it.
Bring it back — verify it rejoins. Then simulate a slow backend (add a
sleep) and observe how least_conn behaves differently from round-robin.

---

### Kubernetes — what developers need to know

Ask Claude:
"I'll be deploying services to Kubernetes but not managing the cluster.
Explain each of these objects from the developer's perspective — not what
they are, but why they exist and what breaks without them: Pod, Deployment,
Service, Ingress, ConfigMap, Secret. Then explain resource requests and
limits: what's the difference, and what actually happens if I set them too
low or don't set them at all? Finally: what does HPA do, how does it work,
and what are its limitations in handling sudden traffic spikes?"

Read:
Official interactive tutorial — do all 6 modules:
https://kubernetes.io/docs/tutorials/kubernetes-basics/

Build:
On minikube or a free cluster (Play with Kubernetes: https://labs.play-with-k8s.com/):
- Deploy a 2-service app: service A exposes an endpoint that calls service B
- Service B is the "slow" one — add resource limits to it
- Set up HPA on service B based on CPU
- Generate load with hey or wrk and watch HPA scale it up
- Observe how long it takes — that delay is the limitation of HPA

---

### Observability: metrics, logs, traces

Ask Claude:
"Explain the three pillars of observability and why you need all three,
not just logging. For metrics: explain counter vs gauge vs histogram, give
me a real example of each in a trading service, and explain why I should
alert on p99 latency instead of average. For distributed tracing: how does
a trace ID propagate from service A through B and C — what changes in the
code, what does a 'span' represent? For SLOs: explain SLI, SLO, and error
budget with a concrete example for a market data API."

Read:
OpenTelemetry concepts: https://opentelemetry.io/docs/concepts/
Google SRE book, Chapter 4 (SLOs): https://sre.google/sre-book/service-level-objectives/

Build:
Pick any service you've written. Add:
- A Prometheus counter for total requests
- A Prometheus histogram for request latency (this is where p99 comes from)
- A label for status code so you can separate errors

Run it, generate traffic with hey, scrape metrics with a local Prometheus
instance, build a Grafana dashboard with: request rate, error rate, p50/p95/p99
latency. Then set an alert rule for p99 > 500ms.

This takes an afternoon and makes the whole observability picture real.

---

## Stage 5 — Patterns at Scale (Depends on Stage 2 & Stage 3)

Standard solutions to standard problems. Once you know them, you recognize
them in every architecture discussion and every engineering blog post.

---

### Rate limiting

Ask Claude:
"Explain rate limiting algorithms with real tradeoffs — not just definitions.
Cover fixed window (what's the boundary problem?), sliding window (what does
it cost to implement correctly?), and token bucket (how does it allow bursts
and what does that mean for an API?). Then explain how to implement a
distributed rate limiter using Redis that works correctly across 20 instances
of a service. What atomicity problem do you need to solve, and how do Lua
scripts in Redis solve it?"

Read:
Stripe's rate limiter implementation — concrete and production-tested:
https://stripe.com/blog/rate-limiters

Build:
Implement a token bucket rate limiter in Redis using a Lua script (so the
read-check-write is atomic). Expose it as a Python function: allow(user_id,
limit, window_seconds) -> bool. Then simulate 3 concurrent services all
calling allow() for the same user at the same time to verify the atomicity
holds. Without the Lua script, it doesn't.

---

### Circuit breakers

Ask Claude:
"Explain the circuit breaker pattern with a specific failure scenario.
Walk me through exactly how a slow downstream service causes your service
to fail — trace the path from one slow dependency to thread pool exhaustion
to your service returning 503s. Then explain circuit breakers: the three
states (closed, open, half-open), what triggers each transition, and
what parameters you'd configure for a real service. Where should a circuit
breaker live — in application code or at the infrastructure layer (service
mesh), and what's the tradeoff?"

Read:
Martin Fowler's explanation, still the best one:
https://martinfowler.com/bliki/CircuitBreaker.html

Build:
Write a CircuitBreaker class in Python that wraps any callable. It should:
- Track failures in a sliding window
- Open after N failures in the window
- Stay open for a configurable cooldown period
- Go half-open after the cooldown (allow one probe)
- Close on a successful probe

Test it by wrapping a function that randomly raises exceptions. Verify the
state transitions happen correctly.

---

### Distributed transactions — the Saga pattern

Ask Claude:
"Explain why two-phase commit (2PC) doesn't scale and what its failure mode
is when the coordinator crashes mid-transaction. Then explain the Saga pattern
as the alternative: what's the difference between choreography and orchestration
sagas? Draw me a text sequence diagram for a 4-step order process (create
order, reserve inventory, charge payment, send confirmation) where payment
fails — show the compensating transactions. Where does compensating become
impossible and how do you design around that?"

Read:
https://microservices.io/patterns/data/saga.html

Build:
Implement an orchestration saga for a simple order flow using in-memory
state (no real services needed — mock the steps with functions). The saga
coordinator should:
- Execute each step in order
- On failure, run compensating transactions for all completed steps in reverse
- Log each step and compensation

Use a random failure in step 3 and verify the compensations run correctly.

---

### CQRS and Event Sourcing

Ask Claude:
"Explain CQRS and Event Sourcing together, starting from the problem they
solve. First: what breaks when you read and write from the same model at
high scale? What does CQRS give you? Then explain Event Sourcing: what does
it mean to store events instead of state, what are the real benefits (give
me 3 concrete ones for a financial system), and what are the real costs
(eventual consistency of read models, event schema changes over time). Use
a brokerage account as the example throughout."

Read:
Martin Fowler on Event Sourcing: https://martinfowler.com/eaaDev/EventSourcing.html
Martin Fowler on CQRS: https://martinfowler.com/bliki/CQRS.html

Build:
Build a bank account using event sourcing. No database — just an in-memory
event store (a list). Events: MoneyDeposited(amount), MoneyWithdrawn(amount),
TransferSent(amount, to), TransferReceived(amount, from). Functions:
apply(account_id, event), get_balance(account_id) — which replays the log,
get_history(account_id), get_balance_at(account_id, timestamp).

Then add a second "projection": get_monthly_summary(account_id, month) — a
read model derived from the event log. Notice you can build any read model
you want from the same events without changing the write side.

---

## Stage 6 — System Design Practice (Depends on Stage 4 & Stage 5)

By this point you know the pieces. Now practice assembling them.

---

### The framework

Ask Claude:
"Teach me how to approach a system design problem in an interview or
architecture discussion. Walk me through a structured framework: how to
scope requirements, how to do back-of-envelope capacity estimation (give
me a worked example with numbers), how to build a high-level design without
over-optimizing early, where to focus deep dives, and how to identify and
talk through failure modes. Use 'design a real-time pub/sub notification
system' as the example to walk the framework through."

---

### The four Bloomberg-relevant designs

For each one, paste this prompt into Claude (replace the system name):

"I want to design [SYSTEM NAME]. Walk me through it using this structure:
clarify requirements and constraints, estimate scale (give rough numbers),
draw the high-level architecture in text, deep dive into the hardest part
of the design, then enumerate failure modes and how the system handles each.
Ask me questions along the way to clarify requirements rather than assuming."

Systems to design:

1. Real-time market data feed
   Ingest price ticks from multiple exchanges. Normalize and fan out to
   thousands of subscribers. Maintain last-known value per instrument for
   late joiners. Handle reconnects. Deal with duplicate and out-of-order data.
   Primary constraint: latency. Sub-100ms end-to-end.

2. Order book
   Bids and asks for thousands of instruments. Orders are placed, modified,
   cancelled, matched. Full audit trail required. Primary constraint:
   consistency and latency. Eventual consistency is not acceptable.

3. News alerting system
   Articles arrive continuously. Each subscriber has keyword/topic rules.
   An alert should fire within 1 second of a matching article being published.
   Scale to millions of rules across hundreds of thousands of users.

4. Rate limiter as a service
   50 microservices delegate rate limit decisions to one service. Per-user,
   per-endpoint limits. Decision latency must be under 5ms. Primary question:
   what happens if the rate limiter itself goes down?

Read:
System Design Primer (use as a reference/checklist, not a tutorial):
https://github.com/donnemartin/system-design-primer

ByteByteGo newsletter (visual walkthroughs of real systems):
https://blog.bytebytego.com/

Real case studies — read these like post-mortems, not tutorials:
  Discord storing trillions of messages (Cassandra → ScyllaDB):
  https://discord.com/blog/how-discord-stores-trillions-of-messages
  Netflix Keystone stream processing platform:
  https://netflixtechblog.com/keystone-real-time-stream-processing-platform-a3ee651812a
  Slack edge cache architecture:
  https://slack.engineering/flannel-an-application-level-edge-cache-to-make-slack-scale/

Build:
Design each system on paper (or a text file). Write the architecture down.
Then take the hardest component and actually implement a stripped-down version.
For the market data feed: write the fanout component — one producer, N
subscribers via WebSocket, last-known-value cache per instrument. That's
the core hard problem. The rest is scaffolding.

---

## Reference

Permanent bookmarks:

Martin Kleppmann's blog (author of DDIA):
https://martin.kleppmann.com/archive.html

Martin Fowler's distributed systems patterns catalog (with code):
https://martinfowler.com/articles/patterns-of-distributed-systems/

Google SRE Book (free online):
https://sre.google/sre-book/table-of-contents/

High Scalability (real architecture case studies):
http://highscalability.com/

---

## Timeline

Stage 0: 1 week
Stage 1: 3 weeks  — don't compress this
Stage 2: 2 weeks
Stage 3: 2 weeks
Stage 4: 1.5 weeks
Stage 5: 1.5 weeks
Stage 6: ongoing

~12 weeks at 1–2 hours/day. 8 weeks fully immersed.
