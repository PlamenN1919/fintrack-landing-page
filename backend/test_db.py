#!/usr/bin/env python3
"""
Test database connection
"""
import os
from sqlalchemy import create_engine, text

# Get DATABASE_URL from environment
database_url = os.getenv('DATABASE_URL', 'postgresql://localhost/fintrack_analytics')

print(f"Testing connection to: {database_url[:50]}...")

try:
    # Create engine
    engine = create_engine(database_url, pool_pre_ping=True)
    
    # Test connection
    with engine.connect() as conn:
        result = conn.execute(text('SELECT 1'))
        print("✅ Database connection successful!")
        print(f"Result: {result.fetchone()}")
        
except Exception as e:
    print(f"❌ Database connection failed!")
    print(f"Error: {str(e)}")
    print(f"\nDatabase URL format: {database_url.split('@')[0]}@...")






