# SentinelAML — AML Transaction Intelligence Platform

## 1. Project Overview

**SentinelAML** is a full-stack Anti-Money Laundering (AML) transaction intelligence platform designed to help compliance teams identify, investigate, and understand suspicious financial transaction patterns.

The platform represents financial transactions as a **network graph**, where customers are represented as nodes and money transfers are represented as directed edges. It combines transaction analysis, graph-based detection techniques, rule-based risk scoring, alerts, dashboards, and investigation tools to provide a centralized environment for AML analysis.

The system is designed as an investigation-support platform rather than simply displaying individual suspicious transactions. It helps analysts understand **how accounts are connected, how money moves between accounts, and which transaction networks require further investigation**.

## 2. Problem Statement

Traditional transaction monitoring systems often generate large numbers of alerts based on individual transaction rules. While these alerts can identify unusual transactions, they may not clearly reveal the relationships between multiple accounts.

Money laundering can involve multiple accounts and transactions arranged in patterns such as:

* Circular money movement
* Fan-in transactions
* Fan-out transactions
* Structuring
* High-frequency transactions
* High-value transfers
* Layering through multiple intermediary accounts

Investigating these patterns manually can be time-consuming and difficult.

**SentinelAML addresses this problem by combining transaction monitoring with graph-based network analysis, allowing investigators to visualize relationships between customers and identify suspicious transaction structures more effectively.**

## 3. Objectives

The main objectives of SentinelAML are:

1. Detect potentially suspicious financial transactions.
2. Identify suspicious relationships between customer accounts.
3. Visualize transaction networks using an interactive graph.
4. Calculate risk scores using configurable detection rules.
5. Generate alerts for suspicious activities.
6. Provide investigators with information required for further analysis.
7. Maintain audit and investigation-related information.
8. Provide role-based access for different compliance users.
9. Provide a foundation for future AI/ML-assisted AML investigation.

## 4. Key Features

### 4.1 Transaction Network Graph

SentinelAML represents financial transactions as an interactive network graph.

* Customers are represented as nodes.
* Transactions are represented as directed edges.
* Transaction relationships can be explored visually.
* Suspicious accounts can be investigated through their connected network.

This makes complex financial relationships easier to understand than a simple transaction table.

### 4.2 Suspicious Pattern Detection

The platform identifies multiple transaction patterns, including:

**Circular Transactions**

Example:

```text
Account A → Account B
Account B → Account C
Account C → Account A
```

Such cycles can indicate potential layering activity.

**Fan-Out Pattern**

```text
             → Account B
            /
Account A → Account C
            \
             → Account D
```

One account distributes money to multiple accounts.

**Fan-In Pattern**

```text
Account A ─┐
Account B ─┼→ Account X
Account C ─┘
```

Multiple accounts transfer money into a single account.

**Structuring**

Multiple transactions are performed around a reporting threshold in an attempt to avoid detection.

**High-Frequency Activity**

Accounts performing an unusually high number of transactions within a limited time period can be flagged for investigation.

### 4.3 Rule-Based Risk Scoring

The system evaluates transaction behaviour using predefined AML detection rules.

Risk factors can include:

* Transaction amount
* Transaction frequency
* Number of connected accounts
* Circular transaction behaviour
* Fan-in/fan-out behaviour
* Suspicious transaction status
* Network relationships

The resulting information is used to calculate risk and prioritize suspicious activity.

### 4.4 Alert Management

The platform generates alerts for suspicious activities.

Alerts can contain:

* Alert title
* Severity
* Related activity
* Investigation status
* Timestamp
* Relevant transaction information

Severity levels can include:

* Critical
* High
* Medium
* Low

### 4.5 Role-Based Access

Different users can access the platform according to their roles.

Supported roles include:

* Administrator
* Compliance Officer
* Analyst
* Investigator

This allows the platform to model a real-world AML investigation environment.

### 4.6 Dashboard

The dashboard provides an overview of AML activity, including:

* Transaction statistics
* Suspicious activity
* Risk information
* Alerts
* Network activity
* Investigation-related information

### 4.7 Customer Management

The system maintains customer information such as:

* Customer name
* Email
* Country
* Date of birth
* Account number

### 4.8 Audit and Notification System

The platform maintains application activity and provides notifications for important suspicious events.

This helps compliance teams keep track of important investigation events.

## 5. Technology Stack

### Frontend

* React
* TypeScript
* Vite
* Tailwind CSS
* Framer Motion
* Lucide React
* React Query
* React Router

### Data Visualization

* React Force Graph
* D3.js
* Interactive network visualization

### Backend

* Node.js
* Express.js
* TypeScript
* REST APIs

### Database

* PostgreSQL
* Drizzle ORM

### API

* REST API
* OpenAPI
* Zod
* Generated API client

### Authentication

* JWT/session-based authentication
* Role-based authorization
* Password hashing using bcrypt

### Development Tools

* Git
* GitHub
* pnpm
* VS Code

## 6. System Architecture

The application follows a modular full-stack architecture.

```text
                    ┌─────────────────────────┐
                    │        User             │
                    │ Admin / Analyst /       │
                    │ Compliance/Investigator │
                    └────────────┬────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │       React UI          │
                    │ Dashboard + Graph +     │
                    │ Alerts + Investigation  │
                    └────────────┬────────────┘
                                 │
                                 │ REST API
                                 ▼
                    ┌─────────────────────────┐
                    │    Express Backend      │
                    │ Authentication          │
                    │ Transactions            │
                    │ Risk Analysis           │
                    │ Alerts                  │
                    └────────────┬────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │    AML Analysis Layer   │
                    │                         │
                    │ Rule-Based Detection    │
                    │ Graph Analysis          │
                    │ Risk Scoring            │
                    └────────────┬────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │      PostgreSQL         │
                    │                         │
                    │ Users                   │
                    │ Customers               │
                    │ Transactions            │
                    │ Alerts                  │
                    │ Notifications           │
                    │ Audit Logs              │
                    └─────────────────────────┘
```

## 7. Project Structure

```text
SentinelAML-Network-Graph/
│
├── artifacts/
│   ├── sentinel-aml/
│   │   ├── src/
│   │   ├── vite.config.ts
│   │   └── package.json
│   │
│   └── api-server/
│       ├── src/
│       └── package.json
│
├── lib/
│   ├── db/
│   │   ├── src/
│   │   │   ├── schema/
│   │   │   └── index.ts
│   │   └── drizzle.config.ts
│   │
│   ├── api-client-react/
│   ├── api-spec/
│   └── api-zod/
│
├── scripts/
│   └── src/
│       └── seed-sentinel-aml.ts
│
├── package.json
├── pnpm-workspace.yaml
├── tsconfig.json
└── README.md
```

## 8. Database Design

The application uses PostgreSQL as its primary database.

Major entities include:

```text
Users
  │
  └── Authentication & Roles

Customers
  │
  └── Account Information
        │
        ▼
Transactions
  │
  ├── Sender
  ├── Receiver
  ├── Amount
  ├── Currency
  ├── Timestamp
  └── Status
        │
        ▼
Risk Analysis
        │
        ▼
Alerts
        │
        ▼
Investigation
```

The transaction table forms the foundation of the network graph because each transaction creates a relationship between a sender and receiver.

## 9. Graph Representation

The transaction network can be represented as a directed graph:

```text
G = (V, E)

V = Customers / Accounts
E = Financial Transactions
```

For example:

```text
Customer A ──₹10,000──> Customer B
Customer B ──₹12,000──> Customer C
Customer C ──₹11,000──> Customer A
```

This creates a cycle:

```text
A → B → C → A
```

Graph analysis can then be used to identify suspicious relationships and transaction structures.

## 10. AML Detection Approach

SentinelAML currently uses a **rule-based detection approach combined with graph analysis**.

The system looks for predefined patterns rather than relying only on individual transactions.

For example:

```text
Transaction Amount
        +
Transaction Frequency
        +
Network Connections
        +
Suspicious Patterns
        ↓
Risk Evaluation
        ↓
Alert Generation
```

This approach provides explainable results because investigators can understand which conditions contributed to suspicious activity.

## 11. Installation

### Prerequisites

Install the following software:

* Node.js
* pnpm
* PostgreSQL
* Git
* VS Code

Recommended environment:

```text
Node.js 22+
pnpm 11+
PostgreSQL 16+
```

### Clone the Repository

```bash
git clone https://github.com/manyataasaxena/SentinelAML-Network-Graph.git

cd SentinelAML-Network-Graph
```

### Install Dependencies

```bash
pnpm install
```

### Configure Environment Variables

Create a `.env` file in the project root:

```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/sentinelaml
SESSION_SECRET=YOUR_SECRET_KEY
NODE_ENV=development
```

Replace `YOUR_PASSWORD` with your PostgreSQL password.

## 12. Database Setup

Create the PostgreSQL database:

```bash
psql -U postgres -c "CREATE DATABASE sentinelaml;"
```

Then push the database schema:

```bash
pnpm --filter @workspace/db run push
```

Seed the database with demonstration data:

```bash
pnpm --filter @workspace/scripts run seed:sentinel-aml
```

The seed process creates:

* Demo users
* Customers
* Transactions
* Suspicious transaction patterns
* Notifications

## 13. Demo Credentials

The default demonstration accounts use the following password:

```text
Password: Sentinel123!
```

Example administrator account:

```text
Email: admin@sentinelaml.dev
Password: Sentinel123!
```

Other roles include:

```text
compliance@sentinelaml.dev
analyst@sentinelaml.dev
investigator@sentinelaml.dev
```

## 14. Running the Backend

Open a terminal in the project root.

Run:

```bash
PORT=8080 pnpm --filter @workspace/api-server run dev
```

The backend will run on:

```text
http://localhost:8080
```

A successful startup should show:

```text
Server listening
port: 8080
```

## 15. Running the Frontend

Open another terminal in the project root.

Run:

```bash
export BASE_PATH=/
export PORT=19799

pnpm --filter @workspace/sentinel-aml run dev
```

The frontend will be available at:

```text
http://localhost:19799/
```

On Windows Git Bash, the above commands can be executed directly.

## 16. Risk Analysis

After starting the backend, users can authenticate and trigger risk analysis.

The risk recomputation endpoint is:

```text
POST /api/risk/recompute
```

For local testing:

```bash
curl -c cookies.txt -X POST http://localhost:8080/api/auth/login \
-H "Content-Type: application/json" \
-d '{"email":"admin@sentinelaml.dev","password":"Sentinel123!"}'
```

Then:

```bash
curl -b cookies.txt -X POST http://localhost:8080/api/risk/recompute
```

The system recalculates risk information and creates alerts based on detected suspicious activity.

## 17. Example AML Investigation Flow

A typical investigation can follow this workflow:

```text
Login
  ↓
Dashboard
  ↓
Review Alerts
  ↓
Select Suspicious Activity
  ↓
Open Transaction Network
  ↓
Analyze Connected Accounts
  ↓
Identify Suspicious Pattern
  ↓
Review Transactions
  ↓
Evaluate Risk
  ↓
Investigation / Follow-up
```

## 18. Future Improvements

The current platform provides a foundation for more advanced AML intelligence capabilities.

### AI Investigation Assistant

An AI-powered investigation assistant can be added to help analysts understand suspicious transaction networks.

Potential capabilities:

* Explain why an account was flagged.
* Summarize suspicious transaction activity.
* Explain graph relationships in natural language.
* Generate investigation summaries.
* Answer questions about selected customers.
* Highlight important connected accounts.
* Suggest investigation steps.

Example:

```text
Analyst:
"Why is this account suspicious?"

AI Assistant:
"This account has been flagged because it participates
in multiple high-value transactions and is connected to
several accounts involved in a circular transaction pattern."
```

### Machine Learning Risk Prediction

A future ML model can learn from historical transaction data and estimate the probability that an account or transaction represents suspicious activity.

Possible models include:

* Logistic Regression
* Random Forest
* XGBoost
* Isolation Forest
* Graph-based ML models

### Graph Machine Learning

Future versions can explore Graph Neural Networks (GNNs) for learning suspicious patterns directly from transaction networks.

Possible approaches include:

* Graph Convolutional Networks
* GraphSAGE
* Graph Attention Networks

### Explainable AI

AI predictions should be accompanied by explanations so that investigators can understand why a transaction or account received a particular risk score.

### Advanced Network Analytics

Future graph capabilities may include:

* Community detection
* Centrality analysis
* Influence analysis
* Shortest suspicious paths
* Connected component analysis
* Network clustering

## 19. Project Novelty

The primary distinguishing aspect of SentinelAML is the combination of **transaction monitoring and graph-based financial network analysis**.

Instead of treating transactions as isolated records, the system focuses on relationships between accounts.

The future AI investigation layer can further improve the platform by converting complex transaction-network information into understandable investigation summaries for compliance analysts.

## 20. Security Considerations

The platform is designed with several security-related considerations:

* Password hashing
* Authentication
* Role-based access control
* Session/JWT-based authorization
* Environment variables for sensitive configuration
* Database-backed access control
* Audit logging

Production deployments should additionally use:

* HTTPS
* Secure cookies
* Secret management
* Rate limiting
* Input validation
* Database encryption
* Proper access policies
* Security monitoring

## 21. Testing and Validation

The platform can be validated by testing:

### Authentication

* Valid login
* Invalid login
* Role-based access

### Transactions

* Transaction creation
* Transaction retrieval
* Suspicious transaction identification

### Graph Analysis

* Customer relationships
* Circular paths
* Fan-in patterns
* Fan-out patterns

### Risk Analysis

* Risk recomputation
* Alert generation
* Severity classification

### UI

* Dashboard
* Transaction graph
* Alerts
* Customer information
* Investigation workflow

## 22. Development Commands

Install dependencies:

```bash
pnpm install
```

Push database schema:

```bash
pnpm --filter @workspace/db run push
```

Seed database:

```bash
pnpm --filter @workspace/scripts run seed:sentinel-aml
```

Run backend:

```bash
PORT=8080 pnpm --filter @workspace/api-server run dev
```

Run frontend:

```bash
export BASE_PATH=/
export PORT=19799
pnpm --filter @workspace/sentinel-aml run dev
```

Type checking:

```bash
pnpm run typecheck
```

Build:

```bash
pnpm run build
```

## 23. Learning Outcomes

Developing SentinelAML provides practical experience with:

* Full-stack TypeScript development
* React application development
* Node.js and Express
* PostgreSQL database design
* REST API development
* Authentication and authorization
* Graph data visualization
* Graph algorithms
* AML domain concepts
* Risk scoring
* Alert management
* Data analysis
* API architecture
* Git and GitHub
* AI/ML integration opportunities

## 24. Project Status

**Current Status:** Functional prototype / development version

The current implementation provides transaction network visualization, rule-based suspicious activity detection, risk analysis, alerts, authentication, dashboards, and investigation-oriented functionality.

Future development will focus on AI-assisted investigation, machine learning-based risk prediction, explainable AI, and advanced graph analytics.

## 25. License

This project is licensed under the **MIT License**.

You are free to use, modify, and distribute this project according to the terms of the MIT License.

## 26. Author

**Manyata Saxena**

SentinelAML — AML Transaction Intelligence Platform                                          # 🛡️ SentinelAML — Anti-Money Laundering Intelligence Platform

> A full-stack AML investigation platform combining transaction monitoring, graph-based network analysis, intelligent risk scoring, potential mule detection, privacy-aware cross-bank analysis, and event-driven processing.

---

## 🚀 Overview

**SentinelAML** is an end-to-end Anti-Money Laundering intelligence platform designed to help compliance teams **detect, analyze, investigate, and prioritize suspicious financial activity**.

Instead of analyzing transactions as isolated records, SentinelAML models financial activity as a **connected transaction network**, enabling investigators to identify suspicious patterns and relationships across accounts.

The platform combines:

- 🔍 Transaction Monitoring
- 🧠 Rule-Based AML Detection
- 🕸️ Graph-Based Network Analysis
- ⚡ Multi-Factor Risk Scoring
- 🕵️ Potential Mule Account Detection
- 🏦 Cross-Bank Analysis
- 🔐 Privacy-Aware Identity Handling
- 📊 Compliance Reporting
- ⚙️ Event-Driven Processing
- 🚨 Alerts & Investigation Workflows
- 🔄 Retry & Dead-Letter Processing
- ⚡ Redis Caching
- 👥 Role-Based Access Control

---

# 🎯 Problem Statement

Financial transactions can appear normal when analyzed individually but reveal suspicious behavior when viewed as part of a larger network.

For example:

```text
Account A
    ↓
Account B
    ↓
Account C
    ↓
Account A
This circular flow can indicate a suspicious transaction pattern.
SentinelAML addresses this challenge by combining transaction-level rules with network-level intelligence, allowing investigators to understand not only what happened, but also how accounts are connected.
✨ Key Features
🔍 1. Transaction Monitoring
Monitor and analyze financial transactions using:
Sender and receiver
Transaction amount
Currency
Timestamp
Transaction status
Account relationships
Risk indicators
The transaction interface supports searching, filtering, monitoring, and reviewing transaction activity.
🧠 2. AML Rule Engine
SentinelAML detects multiple suspicious transaction patterns using configurable AML rules.
Detection Patterns
Circular transaction chains
Fan-in aggregation
Fan-out distribution
High-value transactions
High-frequency activity
Structuring-related activity
Suspicious network relationships
Detected patterns contribute to the overall risk assessment of an account.
🕸️ 3. Interactive Network Graph
SentinelAML represents transaction relationships as a directed graph.
              Account A
                  │
                  ▼
              Account B
             ↙        ↘
        Account C    Account D
             │
             ▼
          Account A
The interactive graph helps investigators identify:
High-risk accounts
Connected entities
Suspicious transaction flows
Circular relationships
Network concentration
Account-to-account relationships
Flagged transaction paths
Risk Visualization
Risk Level
Visualization
🟢 Low
Low-risk nodes
🟠 Medium
Medium-risk nodes
🔴 High
High-risk nodes
🔴 Critical
Critical-risk nodes
⚡ 4. Multi-Factor Risk Scoring
SentinelAML calculates account risk using multiple transaction and behavioral factors.
Risk Factors
Transaction amount
Transaction frequency
Connected accounts
Circular transaction behavior
Fan-in activity
Fan-out activity
Suspicious transaction indicators
Network relationships
Accounts are categorized into:
LOW
MEDIUM
HIGH
CRITICAL
This allows investigators to focus on the entities requiring the most attention.
🕵️ 5. Potential Mule Account Detection
SentinelAML includes an explainable rule-based mule screening system.
The system evaluates behavioral signals such as:
High fan-in
High fan-out
Rapid pass-through activity
Received-to-transferred fund ratios
Cross-bank activity
Transaction velocity
Example:
Multiple Sources
      ↓
   Account X
      ↓
Multiple Destinations
The system provides the reasons contributing to the mule score, making the detection process transparent and explainable.
🏦 6. Privacy-Aware Cross-Bank Analysis
SentinelAML supports analysis across three simulated financial institutions while maintaining privacy-aware entity representation.
The cross-bank investigation module provides:
Cross-bank transaction analysis
Cross-bank flows
Privacy-safe external entities
Pseudonymous identifiers
Restricted identity representation
Network risk analysis
Potential mule detection across institutions
Controlled identity disclosure workflows
Cross-Bank Investigation
             Bank A
                │
                │
        ┌───────▼───────┐
        │ Privacy-Aware │
        │ Network Layer │
        └───────┬───────┘
                │
        ┌───────┴───────┐
        │               │
      Bank B          Bank C
This demonstrates how financial institutions can analyze suspicious relationships while maintaining privacy-aware entity handling.
⚙️ 7. Event-Driven Transaction Processing
SentinelAML includes an event-driven processing architecture using:
Apache Kafka
KafkaJS
Redis
Background AML workers
Retry mechanisms
Dead-Letter Queue
Worker health monitoring
Idempotent transaction processing
Processing Flow
Transaction Received
        ↓
      Kafka
        ↓
    AML Worker
        ↓
 Risk Calculation
        ↓
   ┌────┼────┐
   ↓    ↓    ↓
 Alert Graph Database
This architecture separates transaction ingestion from downstream processing and provides a foundation for scalable AML processing.
🔄 8. Retry & Dead-Letter Queue
The asynchronous processing layer includes fault-tolerant processing.
        Event
          ↓
        Worker
          ↓
      Processing
       ↙      ↘
   Success    Failure
      ↓          ↓
 Processed     Retry
                   ↓
              Retry Limit
                   ↓
                 DLQ
                   ↓
                Replay
This improves reliability and provides a mechanism for recovering failed events.
⚡ 9. Redis Caching
Redis provides a caching layer for frequently accessed data and infrastructure operations.
Capabilities include:
Cache-aside strategy
TTL-based caching
Cache invalidation
Worker heartbeat tracking
Graceful fallback
🔐 10. Authentication & RBAC
SentinelAML includes authentication and role-based access control.
Supported Roles
👑 Admin
🛡️ Compliance Officer
🔎 Analyst
🕵️ Investigator
Security components include:
Authentication
Authorization
Password hashing
Protected APIs
Role-based permissions
Audit logging
🚨 11. Alerts & Investigations
The alert system centralizes suspicious activities detected by the AML engine.
Investigators can analyze:
Alert severity
Account risk
Detection reasons
Transaction relationships
Network connections
Suspicious activity patterns
Investigation Flow
Transaction
     ↓
AML Detection
     ↓
Risk Scoring
     ↓
Alert Generation
     ↓
Network Investigation
     ↓
Compliance Review
📊 12. Compliance Reports
The reporting module provides compliance-oriented insights including:
Highest-risk entities
Risk distribution
Suspicious activity summaries
Account risk scores
Data exports
Investigation information
This helps transform transaction-level information into actionable compliance intelligence.
📝 13. Audit Logs
The platform maintains audit-oriented records for important system and investigation activities.
This provides visibility into:
User activity
Investigation actions
System operations
Compliance workflows
🏗️ System Architecture
┌─────────────────────────────────────────────┐
│                React Frontend               │
│     TypeScript + Vite + Tailwind CSS        │
└──────────────────────┬──────────────────────┘
                       │
                    REST API
                       │
┌──────────────────────▼──────────────────────┐
│              Node.js + Express              │
│                  API Server                  │
└──────────────────────┬──────────────────────┘
                       │
       ┌───────────────┼────────────────┐
       │               │                │
       ▼               ▼                ▼
 ┌──────────┐    ┌────────────┐   ┌───────────┐
 │AML Rules │    │   Graph    │   │   Risk    │
 │  Engine  │    │ Analytics  │   │  Engine   │
 └──────────┘    └────────────┘   └───────────┘
       │               │                │
       └───────────────┼────────────────┘
                       │
                 PostgreSQL
                       │
            ┌──────────┴──────────┐
            │                     │
            ▼                     ▼
         Kafka                  Redis
            │
            ▼
       AML Workers
            │
       ┌────┼────┐
       ▼    ▼    ▼
     Retry DLQ Events
🔄 Transaction Processing Architecture
                 Transaction
                      │
                      ▼
               Input Validation
                      │
                      ▼
               Idempotency Check
                      │
              ┌───────┴───────┐
              │               │
          Sync Mode       Async Mode
              │               │
              ▼               ▼
        AML Processing      Kafka
                              │
                              ▼
                           Worker
                              │
                              ▼
                       Risk Calculation
                              │
                 ┌────────────┼────────────┐
                 ▼            ▼            ▼
               Alert        Graph       Database
                 │          Update
                 └────────────┬────────────┘
                              ▼
                        Investigation
🖥️ Application Modules
📊 Dashboard
Real-time overview of customers, transaction flow, high-risk nodes, and open alerts.
👥 Customers
Search and filter monitored entities using account, name, email, and risk information.
💸 Transactions
Monitor sender, receiver, amount, currency, timestamp, and transaction status.
🕸️ Network Graph
Explore transaction relationships and suspicious network patterns visually.
🏦 Cross-Bank Analysis
Perform privacy-aware analysis across multiple financial institutions.
🕵️ Potential Mules
Identify potential mule behavior using explainable transaction patterns.
🔎 Investigations
Analyze suspicious accounts and transaction networks.
🚨 Alerts
Centralized suspicious-activity detection and review.
📄 Compliance Reports
Generate risk summaries and compliance-oriented reports.
📋 Audit Logs
Track important system and investigation activities.
⚙️ Settings
Manage system configuration and user preferences.
🛠️ Technology Stack
Frontend
React
TypeScript
Vite
Tailwind CSS
Framer Motion
React Query
React Router
Lucide React
React Force Graph
D3.js
Backend
Node.js
Express.js
TypeScript
REST APIs
OpenAPI
Zod
Database
PostgreSQL
Drizzle ORM
Event-Driven Infrastructure
Apache Kafka
KafkaJS
Redis
ioredis
Background Workers
Retry Processing
Dead-Letter Queue
Security
Authentication
Role-Based Access Control
Password Hashing
Protected APIs
Audit Logging
DevOps
Docker
Docker Compose
Git
GitHub
📈 Demo System Overview
The current application demonstrates a connected AML environment with:
Metric
Value
Customer Profiles
127
Transactions
414
High-Risk Nodes
45
Open Alerts
180
Simulated Banks
3
Cross-Bank Accounts
121
Cross-Bank Flows
284
Potential Mule Profiles
19
🧠 AML Intelligence Approach
SentinelAML combines multiple analytical layers:
Transaction Rules
       +
Behavioral Indicators
       +
Graph Relationships
       +
Network Risk
       +
Cross-Bank Signals
       +
Risk Scoring
       ↓
AML Investigation Intelligence
The architecture is designed to support future intelligence layers such as:
Machine Learning anomaly detection
Advanced behavioral profiling
Graph embeddings
Community detection
Centrality analysis
Explainable AI
AI-assisted investigations
Advanced graph intelligence
🧪 Testing & Reliability
The infrastructure includes testing and reliability mechanisms for:
Event processing
Retry behavior
Event identity
Redis fallback
Asynchronous processing
Worker health
Failure recovery
🐳 Docker Support
The project includes Docker Compose infrastructure for running the application and supporting services.
docker compose up --build
⚙️ Local Setup
1. Clone Repository
git clone https://github.com/manyataasaxena/Sentinel-AML-Network-Graph.git
cd Sentinel-AML-Network-Graph
2. Install Dependencies
pnpm install
3. Configure Environment
Configure the required database, Kafka, and Redis environment variables.
Example:
DATABASE_URL=your_postgresql_connection_string
REDIS_URL=your_redis_connection_string
KAFKA_BROKERS=your_kafka_broker
4. Start Development Environment
pnpm dev
5. Docker Environment
docker compose up --build
📸 Application Preview
System Dashboard
The central dashboard provides a real-time overview of monitored entities, transaction flow, high-risk accounts, and active alerts.
Transaction Monitoring
Monitor and filter transaction activity across accounts and currencies.
Network Graph
Explore connected financial entities and identify suspicious transaction relationships.
Cross-Bank Analysis
Analyze privacy-aware transaction relationships across multiple simulated banks.
Potential Mule Detection
Investigate potential mule accounts using explainable behavioral indicators.
Compliance Reports
Review risk distribution and highest-risk entities for compliance investigation.
🎯 Project Highlights
🔹 Network-Centric AML
Moves beyond isolated transaction monitoring by analyzing relationships between financial entities.
🔹 Explainable Risk Analysis
Provides visible risk factors behind suspicious activity and potential mule detection.
🔹 Privacy-Aware Cross-Bank Intelligence
Demonstrates cross-institution investigation while using privacy-safe external entity representations.
🔹 Event-Driven Architecture
Uses Kafka, asynchronous workers, Redis, retry processing, and DLQ infrastructure.
🔹 Investigator-Centric Interface
Provides dedicated workflows for transactions, alerts, investigations, network analysis, mule screening, and compliance reporting.
🔹 Scalable Architecture
Designed with modular services and asynchronous processing to support future expansion.
🚀 Future Enhancements
Machine Learning anomaly detection
Advanced behavioral profiling
Graph embeddings
Community detection
Centrality and influence analysis
Explainable AI / SHAP
AI-assisted investigation
Automated investigation summaries
Advanced graph intelligence
Real-time intelligence pipelines
👩‍💻 Author
Manyata Saxena
B.Tech — Computer Science Engineering
