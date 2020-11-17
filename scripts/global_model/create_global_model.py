import csv
import json
import os

model = {
    'datasets-sorted': ['SEM_L1_3', 'TEM_L1_5', 'SEM_L1_4', 'SEM_L1_2', 'SEM_L2_2', 'TEM_L3', 'TEM_adult', 'SEM_adult'],
    'neurons': ['ADFL', 'ADFR', 'ADLL', 'ADLR', 'AFDL', 'AFDR', 'ALML', 'ALMR', 'ALNL', 'ALNR', 'AQR', 'ASEL', 'ASER', 'ASGL', 'ASGR', 'ASHL', 'ASHR', 'ASIL', 'ASIR', 'ASJL', 'ASJR', 'ASKL', 'ASKR', 'AUAL', 'AUAR', 'AVM', 'AWAL', 'AWAR', 'AWBL', 'AWBR', 'AWCL', 'AWCR', 'BAGL', 'BAGR', 'DVA', 'FLPL', 'FLPR', 'IL2DL', 'IL2DR', 'IL2L', 'IL2R', 'IL2VL', 'IL2VR', 'OLLL', 'OLLR', 'OLQDL', 'OLQDR', 'OLQVL', 'OLQVR', 'PLNL', 'PLNR', 'SAADL', 'SAADR', 'SAAVL', 'SAAVR', 'SDQL', 'SDQR', 'URBL', 'URBR', 'URXL', 'URXR', 'URYDL', 'URYDR', 'URYVL', 'URYVR', 'ADAL', 'ADAR', 'AIAL', 'AIAR', 'AIBL', 'AIBR', 'AINL', 'AINR', 'AIYL', 'AIYR', 'AIZL', 'AIZR', 'AVAL', 'AVAR', 'AVBL', 'AVBR', 'AVDL', 'AVDR', 'AVEL', 'AVER', 'BDUL', 'BDUR', 'DVC', 'PVCL', 'PVCR', 'PVNL', 'PVNR', 'PVPL', 'PVPR', 'PVR', 'PVT', 'RIAL', 'RIAR', 'RIBL', 'RIBR', 'RIFL', 'RIFR', 'RIGL', 'RIGR', 'RIH', 'RIML', 'RIMR', 'RIPL', 'RIPR', 'RIR', 'IL1DL', 'IL1DR', 'IL1L', 'IL1R', 'IL1VL', 'IL1VR', 'RIVL', 'RIVR', 'RMDDL', 'RMDDR', 'RMDL',
                'RMDR', 'RMDVL', 'RMDVR', 'RMED', 'RMEL', 'RMER', 'RMEV', 'RMFL', 'RMFR', 'RMHL', 'RMHR', 'SIADL', 'SIADR', 'SIAVL', 'SIAVR', 'SIBDL', 'SIBDR', 'SIBVL', 'SIBVR', 'SMBDL', 'SMBDR', 'SMBVL', 'SMBVR', 'SMDDL', 'SMDDR', 'SMDVL', 'SMDVR', 'URADL', 'URADR', 'URAVL', 'URAVR', 'ADEL', 'ADER', 'AIML', 'AIMR', 'ALA', 'AVFL', 'AVFR', 'AVHL', 'AVHR', 'AVJL', 'AVJR', 'AVKL', 'AVKR', 'AVL', 'CEPDL', 'CEPDR', 'CEPVL', 'CEPVR', 'HSNL', 'HSNR', 'PVQL', 'PVQR', 'RICL', 'RICR', 'RID', 'RIS', 'RMGL', 'RMGR', 'BWM-DL01', 'BWM-DR01', 'BWM-VL01', 'BWM-VR01', 'BWM-DL02', 'BWM-DR02', 'BWM-VL02', 'BWM-VR02', 'BWM-DL03', 'BWM-DR03', 'BWM-VL03', 'BWM-VR03', 'BWM-DL04', 'BWM-DR04', 'BWM-VL04', 'BWM-VR04', 'BWM-DL05', 'BWM-DR05', 'BWM-VL05', 'BWM-VR05', 'BWM-DL06', 'BWM-DR06', 'BWM-VL06', 'BWM-VR06', 'BWM-DL07', 'BWM-DR07', 'BWM-VL07', 'BWM-VR07', 'BWM-DL08', 'BWM-DR08', 'BWM-VL08', 'BWM-VR08', 'CANL', 'CANR', 'CEPshDL', 'CEPshDR', 'CEPshVL', 'CEPshVR', 'GLRDL', 'GLRDR', 'GLRL', 'GLRR', 'GLRVL', 'GLRVR', 'excgl'],
    'stats': {
        'max-contact-area': 0.0,
        'max-connectivity': 0
    },
    'neuron-pair-data': {
    }
}


def init_model():
    for pre in model['neurons']:
        for post in model['neurons']:
            key = neuron_pair_key(pre, post)
            model['neuron-pair-data'][key] = {
                'contact': [],
                'connectivity': [],
                'annotations': []
            }

# contact documentation:
# row of number or None -- None means the dataset did not have a contact matrix file
# if whole row is 0 or None set whole entry to None

# connectivity documentation:
# row of number or None -- None means the dataset did not have a connectivity matrix file
# if whole row is 0 or None set whole entry to None


def neuron_pair_key(neuron0, neuron1):
    return f'{neuron0}${neuron1}'


def add_contact_area_to_model():

    max_area = 0.0
    for dataset in model['datasets-sorted']:
        fname = './processing/global_model/' + dataset + '_adjacency.csv'

        if os.path.isfile(fname):
            with open(fname) as f:
                csvdata = list(csv.reader(f))
                for line in csvdata[1:]:
                    n0 = line[0]
                    for i in range(1, len(line)):
                        n1 = model['neurons'][i-1]
                        key = neuron_pair_key(n0, n1)
                        float_area = float(line[i])

                        if float_area > max_area:
                            max_area = float_area

                        model['neuron-pair-data'][key]['contact'].append(
                            float_area)

        else:
            for n0 in model['neurons']:
                for n1 in model['neurons']:
                    key = neuron_pair_key(n0, n1)
                    model['neuron-pair-data'][key]['contact'].append(None)

    for k, v in model['neuron-pair-data'].items():
        s = sum(filter(None, v['contact']))  # filter None values from contact
        if s == 0.0:
            model['neuron-pair-data'][k]['contact'] = None

    model['stats']['max-contact-area'] = max_area


def neuron_pair_key(neuron0, neuron1):
    return f'{neuron0}${neuron1}'


def add_connectivity_to_model():
    max_connectivity = 0.0
    for dataset in model['datasets-sorted']:
        fname = './processing/global_model/' + dataset + '_connectivity.csv'

        if os.path.isfile(fname):
            with open(fname) as f:
                csvdata = list(csv.reader(f))
                for line in csvdata[1:]:
                    n0 = line[0]
                    for i in range(1, len(line)):
                        n1 = model['neurons'][i-1]
                        key = neuron_pair_key(n0, n1)
                        weight = int(line[i])

                        if weight > max_connectivity:
                            max_connectivity = weight

                        model['neuron-pair-data'][key]['connectivity'].append(
                            weight)

        else:
            for n0 in model['neurons']:
                for n1 in model['neurons']:
                    key = neuron_pair_key(n0, n1)
                    model['neuron-pair-data'][key]['connectivity'].append(None)

    for k, v in model['neuron-pair-data'].items():
        # filter None values from contact
        s = sum(filter(None, v['connectivity']))
        if s == 0:
            model['neuron-pair-data'][k]['connectivity'] = None

    model['stats']['max-connectivity'] = max_connectivity


def add_annotations_to_model():
    edge_classification_map = {
        'increase': 'developmentally-added',
        'decrease': 'developmentally-pruned',
        'stable': 'stable',
        'postembryonic': 'post-embryonic',
        'variable': 'variable'
    }
    with open('./processing/global_model/edge_classifications.json') as f:
        data = json.load(f)
        for k, v in data.items():
            for pair in v:
                pre, post = pair
                key = neuron_pair_key(pre, post)
                model['neuron-pair-data'][key]['annotations'].append(
                    edge_classification_map[k])

    for pre in model['neurons']:
        for post in model['neurons']:
            key = neuron_pair_key(pre, post)
            annotations = model['neuron-pair-data'][key]['annotations']
            if len(annotations) > 0:
                print(annotations)


init_model()
add_contact_area_to_model()
add_connectivity_to_model()
add_annotations_to_model()
with open('./processing/model-1.json', 'w') as f:
    # json.dump(model, f, indent=2)
    json.dump(model, f)
