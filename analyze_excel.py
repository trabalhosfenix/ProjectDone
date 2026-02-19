
import pandas as pd
import sys

try:
    file_path = r'c:\Users\Micro\Desktop\JACANAWORKANA\Modelo_cronograma.xlsx'
    df = pd.read_excel(file_path)
    
    print("--- HEADERS ---")
    print(list(df.columns))
    print("\n--- FIRST 3 ROWS ---")
    print(df.head(3).to_string())
    print("\n--- DATA TYPES ---")
    print(df.dtypes)
    
except Exception as e:
    print(f"Error: {e}")
