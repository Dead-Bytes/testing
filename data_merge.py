import json 

file_1 = 'sol_alpaca_labeled_no_history_upgraded_together.json'
file_2 = 'sol_alpaca_labeled_no_history_upgraded.json'

with open(file_1, 'r') as f:
    data_1 = json.load(f)

with open(file_2, 'r') as f:
    data_2 = json.load(f)


filetered_data_1 = []  

for data in data_1:
    try:
        if data['updated']:
            filetered_data_1.append(data)
    except:
        pass

for data in data_2:
    try:
        if data['updated']:
            filetered_data_1.append(data)
    except:
        pass

with open('solidity_dataset_updated.json', 'w') as f:
    json.dump(filetered_data_1, f, indent=2)