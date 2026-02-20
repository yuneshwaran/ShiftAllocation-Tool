
CREATE TABLE shiftrosterdev.project_lead (
    lead_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    lead_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    passhash VARCHAR(255) NOT NULL,

    is_active TINYINT(1) NOT NULL DEFAULT 1,
    is_admin TINYINT(1) NOT NULL DEFAULT 0,

    otp_code VARCHAR(10),
    otp_expiry DATETIME,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE shiftrosterdev.employee (
    emp_id BIGINT PRIMARY KEY,
    emp_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    passhash VARCHAR(255),                

    is_experienced TINYINT(1) NOT NULL DEFAULT 0,
    is_active TINYINT(1) NOT NULL DEFAULT 1,

    reporting_to BIGINT,                   
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_employee_lead
        FOREIGN KEY (reporting_to)
        REFERENCES shiftrosterdev.project_lead (lead_id)
        ON DELETE SET NULL
);

CREATE TABLE shiftrosterdev.project (
    project_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,

    lead_id BIGINT NOT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	last_updated DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_project_lead
        FOREIGN KEY (lead_id)
        REFERENCES shiftrosterdev.project_lead (lead_id)
        ON DELETE RESTRICT
);

CREATE TABLE shiftrosterdev.project_employee (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    project_id BIGINT NOT NULL,
    emp_id BIGINT NOT NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_pe_project
        FOREIGN KEY (project_id)
        REFERENCES shiftrosterdev.project (project_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_pe_employee
        FOREIGN KEY (emp_id)
        REFERENCES shiftrosterdev.employee (emp_id)
        ON DELETE CASCADE,

    CONSTRAINT uq_project_employee
        UNIQUE (project_id, emp_id)
);

CREATE TABLE shiftrosterdev.project_shift_master (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    project_id BIGINT NOT NULL,

    shift_code VARCHAR(20) NOT NULL,        
    shift_name VARCHAR(50) NOT NULL,        

    start_time TIME NOT NULL,
    end_time TIME NOT NULL,

    weekday_allowance DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    weekend_allowance DECIMAL(10,2) NOT NULL DEFAULT 0.00,

    effective_from DATE NOT NULL,
    effective_to DATE DEFAULT NULL,

    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_psm_project
        FOREIGN KEY (project_id)
        REFERENCES shiftrosterdev.project (project_id)
        ON DELETE CASCADE,

    CONSTRAINT uq_project_shift_effective
        UNIQUE (project_id, shift_code, effective_from)
);

ALTER TABLE shiftrosterdev.project_shift_master
ADD COLUMN updated_at DATETIME
  DEFAULT CURRENT_TIMESTAMP
  ON UPDATE CURRENT_TIMESTAMP;


CREATE INDEX idx_psm_project_date
ON shiftrosterdev.project_shift_master (project_id, shift_code, effective_from, effective_to);

CREATE TABLE shiftrosterdev.shift_allocation (
    allocation_id BIGINT AUTO_INCREMENT PRIMARY KEY,

    project_id BIGINT NOT NULL,
    emp_id BIGINT NOT NULL,

    shift_code VARCHAR(20) NOT NULL,
    shift_date DATE NOT NULL,

    is_approved TINYINT(1) NOT NULL DEFAULT 0,
    last_updated DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_sa_project
        FOREIGN KEY (project_id)
        REFERENCES shiftrosterdev.project (project_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_sa_employee
        FOREIGN KEY (emp_id)
        REFERENCES shiftrosterdev.employee (emp_id)
        ON DELETE CASCADE,

    CONSTRAINT uq_emp_project_shift_day
        UNIQUE (emp_id, project_id, shift_code, shift_date)
);



CREATE TABLE shiftrosterdev.holiday_master (
    holiday_id     INT AUTO_INCREMENT PRIMARY KEY,
    holiday_date   DATE NOT NULL UNIQUE,
    holiday_name   VARCHAR(100) NOT NULL,
    is_optional    BOOLEAN DEFAULT 0,
    created_at     DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE shiftrosterdev.project_holiday (
    holiday_id INT AUTO_INCREMENT PRIMARY KEY,
    project_id BIGINT NULL,
    holiday_date DATE NOT NULL,
    holiday_name VARCHAR(100) NOT NULL,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_project_holiday_project
        FOREIGN KEY (project_id)
        REFERENCES shiftrosterdev.project(project_id)
        ON DELETE CASCADE,

    CONSTRAINT uq_project_holiday
        UNIQUE (project_id, holiday_date)
);