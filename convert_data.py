import pandas as pd
import os

# Path check
input_file = "PS_20174392719_1491204439457_log.csv"

if os.path.exists(input_file):
    print("⏳ Processing file...")
    # Read first 2000 rows
    df = pd.read_csv(input_file, nrows=2000)

    # RIFT Format conversion
    mule_df = pd.DataFrame()
    mule_df['transaction_id'] = ["TX_" + str(i) for i in range(len(df))]
    mule_df['sender_id'] = df['nameOrig']
    mule_df['receiver_id'] = df['nameDest']
    mule_df['amount'] = df['amount']
    # Use a fixed timestamp for demo or current time
    mule_df['timestamp'] = "2026-02-19 10:00:00"

    # Save
    output_file = "mule_test_data.csv"
    mule_df.to_csv(output_file, index=False)
    print(f"✅ Success! '{output_file}' ready!")
else:
    print(f"❌ Error: '{input_file}' not found. Please extract the ZIP or ensure the file is in this directory.")