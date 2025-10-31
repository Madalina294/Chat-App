# 🚀 Backend Setup Guide

## Prerequisites

- Java 17 or higher
- PostgreSQL database
- Maven
- Gmail account (for email functionality)

## Configuration Setup

### 1. Database Configuration

1. Create a PostgreSQL database for your application
2. Note down the database name, username, and password

### 2. Application Properties

1. Copy the template file:

   ```bash
   cp src/main/resources/application.properties.template src/main/resources/application.properties
   ```

2. Edit `src/main/resources/application.properties` with your actual values:

#### Database Settings

```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/YOUR_DATABASE_NAME
spring.datasource.username=YOUR_DB_USERNAME
spring.datasource.password=YOUR_DB_PASSWORD
```

#### JWT Security

```properties
# Generate a secure 256-bit secret key
application.security.jwt.secret-key=YOUR_SECURE_JWT_SECRET_KEY
```

#### Email Configuration (Gmail)

```properties
spring.mail.username=your-email@gmail.com
spring.mail.password=YOUR_APP_PASSWORD
```

### 3. Gmail App Password Setup

1. Go to your Google Account settings
2. Enable 2-Factor Authentication
3. Generate an App Password:
   - Go to Security → 2-Step Verification → App passwords
   - Select "Mail" and generate password
   - Use this generated password in `spring.mail.password`

### 4. JWT Secret Key Generation

Generate a secure secret key (minimum 256 bits):

```bash
# Option 1: Using openssl
openssl rand -base64 32

# Option 2: Using Java
java -cp . -c "System.out.println(java.util.Base64.getEncoder().encodeToString(java.security.SecureRandom.getInstanceStrong().generateSeed(32)));"
```

## Running the Application

### 1. Install Dependencies

```bash
mvn clean install
```

### 2. Run the Application

```bash
mvn spring-boot:run
```

The application will start on `http://localhost:8080`

## Default Admin Account

On first run, an admin account is automatically created:

- **Email**: admin@gmail.com
- **Password**: Adminul_0
- **Role**: ADMIN
- **MFA**: Enabled

## API Endpoints

- Authentication: `http://localhost:8080/api/auth`
- User Management: `http://localhost:8080/api/users`

## Security Notes

- ⚠️ Never commit `application.properties` to version control
- 🔒 Use strong passwords and secure JWT keys
- 📧 Use App Passwords for Gmail, not your regular password
- 🔐 Keep your database credentials secure

## Troubleshooting

### Email Issues

- Verify Gmail App Password is correct
- Check if 2FA is enabled on your Google account
- Ensure "Less secure app access" is disabled (use App Password instead)

### Database Issues

- Verify PostgreSQL is running
- Check database name, username, and password
- Ensure the database exists

### JWT Issues

- Ensure JWT secret key is at least 256 bits
- Check key encoding (Base64)
