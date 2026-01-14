# CampusHub

**CampusHub** is a comprehensive web platform designed to facilitate the management of university clubs, events, and student interactions. It serves as a centralized hub where students can discover clubs, join events, and stay updated with campus life.

> **Note:** This repository contains the full stack source code. My primary contributions and responsibilities were focused on the **Backend Architecture**, **Database Management**, and **DevOps (CI/CD)** operations.

---

## 👨‍💻 My Contributions

I was responsible for the entire server-side development and infrastructure of the project. My key contributions include:

- **Backend Development:** Designed and implemented a high-performance RESTful API using **Python** and **Sanic Framework**.
- **Database Design:** Architected the relational database schema using **MySQL** and managed ORM operations with **Tortoise ORM**.
- **Caching & Performance:** Integrated **Redis** for caching frequently accessed data and implementing rate limiting to secure the API.
- **DevOps & CI/CD:** Built a complete CI/CD pipeline using **GitHub Actions** for automated testing, linting, and Docker image building.
- **Containerization:** Dockerized the application services using **Docker** and **Docker Compose** for consistent development and deployment environments.

---

## 🛠️ Tech Stack

### Backend & Database
- **Language:** Python 3.10+
- **Framework:** [Sanic](https://sanic.dev/) (Asynchronous Web Framework)
- **Database:** MySQL 8.0
- **ORM:** Tortoise ORM
- **Cache:** Redis 7
- **Authentication:** JWT (JSON Web Tokens) with Bcrypt hashing
- **Other Libraries:** `sanic-limiter` (Rate Limiting), `aiosmtplib` (Async Email), `pytest` (Testing)

### DevOps & Infrastructure
- **Containerization:** Docker & Docker Compose
- **CI/CD:** GitHub Actions
- **Linting:** Flake8

---

## 🏗️ Architecture & Features

The backend is built with a modular architecture using Sanic Blueprints. Key modules include:

- **🔐 Authentication:** Secure registration and login system with role-based access control (Admin, Club President, User).
- **🏆 Club Management:** Endpoints for creating clubs, managing membership requests, and club administration panels.
- **📅 Event System:** Full CRUD operations for events, including user participation tracking.
- **🔔 Notifications:** Real-time notification system for users.
- **💬 Comments:** Interaction layer for users to comment on club events.
- **⛅ Weather Integration:** External API integration to display weather forecasts for events.
- **🛡️ Security:** Implementation of CORS policies and API Rate Limiting to prevent abuse.

---

## 🚀 Getting Started

Follow these steps to set up the project locally.

### Prerequisites
- Docker & Docker Compose
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone [https://github.com/Josephtus/CampusHub.git](https://github.com/yourusername/campushub.git)
   cd campushub