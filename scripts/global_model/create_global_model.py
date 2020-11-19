import csv
import json
import os
import copy



# temp values used to help pre populate the model
# these values are pulled from Daniels data
datasetsSorted = ['SEM_L1_3', 'TEM_L1_5', 'SEM_L1_4',
                  'SEM_L1_2', 'SEM_L2_2', 'TEM_L3', 'TEM_adult', 'SEM_adult']
neuronsSorted = ['ADFL', 'ADFR', 'ADLL', 'ADLR', 'AFDL', 'AFDR', 'ALML', 'ALMR', 'ALNL', 'ALNR', 'AQR', 'ASEL', 'ASER', 'ASGL', 'ASGR', 'ASHL', 'ASHR', 'ASIL', 'ASIR', 'ASJL', 'ASJR', 'ASKL', 'ASKR', 'AUAL', 'AUAR', 'AVM', 'AWAL', 'AWAR', 'AWBL', 'AWBR', 'AWCL', 'AWCR', 'BAGL', 'BAGR', 'DVA', 'FLPL', 'FLPR', 'IL2DL', 'IL2DR', 'IL2L', 'IL2R', 'IL2VL', 'IL2VR', 'OLLL', 'OLLR', 'OLQDL', 'OLQDR', 'OLQVL', 'OLQVR', 'PLNL', 'PLNR', 'SAADL', 'SAADR', 'SAAVL', 'SAAVR', 'SDQL', 'SDQR', 'URBL', 'URBR', 'URXL', 'URXR', 'URYDL', 'URYDR', 'URYVL', 'URYVR', 'ADAL', 'ADAR', 'AIAL', 'AIAR', 'AIBL', 'AIBR', 'AINL', 'AINR', 'AIYL', 'AIYR', 'AIZL', 'AIZR', 'AVAL', 'AVAR', 'AVBL', 'AVBR', 'AVDL', 'AVDR', 'AVEL', 'AVER', 'BDUL', 'BDUR', 'DVC', 'PVCL', 'PVCR', 'PVNL', 'PVNR', 'PVPL', 'PVPR', 'PVR', 'PVT', 'RIAL', 'RIAR', 'RIBL', 'RIBR', 'RIFL', 'RIFR', 'RIGL', 'RIGR', 'RIH', 'RIML', 'RIMR', 'RIPL', 'RIPR', 'RIR', 'IL1DL', 'IL1DR', 'IL1L', 'IL1R', 'IL1VL', 'IL1VR', 'RIVL', 'RIVR', 'RMDDL', 'RMDDR', 'RMDL',
                 'RMDR', 'RMDVL', 'RMDVR', 'RMED', 'RMEL', 'RMER', 'RMEV', 'RMFL', 'RMFR', 'RMHL', 'RMHR', 'SIADL', 'SIADR', 'SIAVL', 'SIAVR', 'SIBDL', 'SIBDR', 'SIBVL', 'SIBVR', 'SMBDL', 'SMBDR', 'SMBVL', 'SMBVR', 'SMDDL', 'SMDDR', 'SMDVL', 'SMDVR', 'URADL', 'URADR', 'URAVL', 'URAVR', 'ADEL', 'ADER', 'AIML', 'AIMR', 'ALA', 'AVFL', 'AVFR', 'AVHL', 'AVHR', 'AVJL', 'AVJR', 'AVKL', 'AVKR', 'AVL', 'CEPDL', 'CEPDR', 'CEPVL', 'CEPVR', 'HSNL', 'HSNR', 'PVQL', 'PVQR', 'RICL', 'RICR', 'RID', 'RIS', 'RMGL', 'RMGR', 'BWM-DL01', 'BWM-DR01', 'BWM-VL01', 'BWM-VR01', 'BWM-DL02', 'BWM-DR02', 'BWM-VL02', 'BWM-VR02', 'BWM-DL03', 'BWM-DR03', 'BWM-VL03', 'BWM-VR03', 'BWM-DL04', 'BWM-DR04', 'BWM-VL04', 'BWM-VR04', 'BWM-DL05', 'BWM-DR05', 'BWM-VL05', 'BWM-VR05', 'BWM-DL06', 'BWM-DR06', 'BWM-VL06', 'BWM-VR06', 'BWM-DL07', 'BWM-DR07', 'BWM-VL07', 'BWM-VR07', 'BWM-DL08', 'BWM-DR08', 'BWM-VL08', 'BWM-VR08', 'CANL', 'CANR', 'CEPshDL', 'CEPshDR', 'CEPshVL', 'CEPshVR', 'GLRDL', 'GLRDR', 'GLRL', 'GLRR', 'GLRVL', 'GLRVR', 'excgl']

# this is the skeleton of the model
# it will be filled out by the various functions below
# and exported to json
model = {
    'datasets': [],
    'neurons': [],
    'stats': {
        'maxContactArea': 0.0,
        'maxConnectivityCs': 0,
        'maxConnectivityGj': 0
    },
    'neuronPairData': {
    }
}


def init_model():
    for pre in neuronsSorted:
        for post in neuronsSorted:
            key = neuron_pair_key(pre, post)
            model['neuronPairData'][key] = {
                'contactArea': [],
                'connectivityCs': [],
                'connectivityGj': [],
                'annotations': []
            }

# contact documentation:
# row of number or None -- None means the dataset did not have a contact matrix file
# if whole row is 0 or None set whole entry to None

# connectivity-(gj/cs) documentation:
# row of number or None -- None means the dataset did not have a connectivity matrix file
# if whole row is 0 or None set whole entry to None

# annotations documentation:
# annotations describe a connection


def neuron_pair_key(neuron0, neuron1):
    return f'{neuron0}${neuron1}'


def add_datasets_to_model():
    with open('./scripts/global_model/datasets.json') as f:
        model['datasets'] = json.load(f)


def add_neuron_info_to_model():
    neuron_info = None
    with open('./scripts/global_model/neurons.json') as f:
        neuron_info = json.load(f)

    # TODO figure out how to interpret volume area for each neuron for each dataset
    # neuron_volume_info = {}
    # for dataset in datasetsSorted:
    #     fname = './scripts/global_model' + dataset + '_volume_area.csv'

    for neuron in neuronsSorted:
        info = neuron_info['cells'][neuron]
        class_members = neuron_info['classes'][info['class']
                                               ]['classMemberIds']

        model['neurons'].append({
            'id': neuron,
            'class': info['class'],
            'types': info['types'],
            'neurotransmitterTypes': info['neurotransmitterTypes'],
            'classMembers': class_members
        })


def add_contact_area_to_model():

    max_area = 0.0
    for dataset in datasetsSorted:
        fname = './scripts/global_model/' + dataset + '_adjacency.csv'

        if os.path.isfile(fname):
            with open(fname) as f:
                csvdata = list(csv.reader(f))
                for line in csvdata[1:]:
                    n0 = line[0]
                    for i in range(1, len(line)):
                        n1 = neuronsSorted[i-1]
                        key = neuron_pair_key(n0, n1)
                        float_area = float(line[i])

                        if float_area > max_area:
                            max_area = float_area

                        model['neuronPairData'][key]['contactArea'].append(
                            float_area)

        else:
            for n0 in neuronsSorted:
                for n1 in neuronsSorted:
                    key = neuron_pair_key(n0, n1)
                    model['neuronPairData'][key]['contactArea'].append(None)

    for k, v in model['neuronPairData'].items():
        # filter None values from contact
        s = sum(filter(None, v['contactArea']))
        if s == 0.0:
            model['neuronPairData'][k]['contactArea'] = None

    model['stats']['maxContactArea'] = max_area


def add_connectivity_cs_to_model():
    max_connectivity = 0.0
    for dataset in datasetsSorted:
        fname = './scripts/global_model/' + dataset + '_connectivity.csv'

        if os.path.isfile(fname):
            with open(fname) as f:
                csvdata = list(csv.reader(f))
                for line in csvdata[1:]:
                    n0 = line[0]
                    for i in range(1, len(line)):
                        n1 = neuronsSorted[i-1]
                        key = neuron_pair_key(n0, n1)
                        weight = int(line[i])

                        if weight > max_connectivity:
                            max_connectivity = weight

                        model['neuronPairData'][key]['connectivityCs'].append(
                            weight)

        else:
            for n0 in neuronsSorted:
                for n1 in neuronsSorted:
                    key = neuron_pair_key(n0, n1)
                    model['neuronPairData'][key]['connectivityCs'].append(
                        None)

    for k, v in model['neuronPairData'].items():
        # filter None values from contact
        s = sum(filter(None, v['connectivityCs']))
        if s == 0:
            model['neuronPairData'][k]['connectivityCs'] = None

    model['stats']['maxConnectivityCs'] = max_connectivity


def add_connectivity_gj_to_model():
    max_connectivity = 0.0
    for dataset in datasetsSorted:
        fname = './scripts/global_model/' + dataset + '_connectivity_gj.csv'

        if os.path.isfile(fname):
            with open(fname) as f:
                csvdata = list(csv.reader(f))
                for line in csvdata[1:]:
                    n0 = line[0]
                    for i in range(1, len(line)):
                        n1 = neuronsSorted[i-1]
                        key = neuron_pair_key(n0, n1)
                        weight = int(line[i])

                        if weight > max_connectivity:
                            max_connectivity = weight

                        model['neuronPairData'][key]['connectivityGj'].append(
                            weight)

        else:
            for n0 in neuronsSorted:
                for n1 in neuronsSorted:
                    key = neuron_pair_key(n0, n1)
                    model['neuronPairData'][key]['connectivityGj'].append(
                        None)

    for k, v in model['neuronPairData'].items():
        # filter None values from contact
        s = sum(filter(None, v['connectivityGj']))
        if s == 0:
            model['neuronPairData'][k]['connectivityGj'] = None

    model['stats']['maxConnectivityGj'] = max_connectivity


def add_annotations_to_model():

    with open('./scripts/global_model/edge_classifications.json') as f:
        data = json.load(f)
        for k, v in data.items():
            for pair in v:
                pre, post = pair
                key = neuron_pair_key(pre, post)
                model['neuronPairData'][key]['annotations'].append(k)


def compress_model_full(m):
    # prune empty values and compress json keys
    key_to_compressed_key = {
        'contactArea': 'ca',
        'connectivityCs': 'c',
        'connectivityGj': 'g',
        'annotations': 'a'
    }

    neuron_field_key_to_compressed_key = {
        'class': 'c',
        'types': 't',
        'neurotransmitterTypes': 'nt',
        'classMembers': 'cm'
    }

    neuron_type_to_compressed_type = {
        'sensory': 's',
        'modulatory': 'm',
        'interneuron': 'i',
        'motor': 't',
        'muscle': 'u',
        'other': 'o'
    }

    neuron_neurotransmitter_type_to_compressed_type = {
        'acetylcholine': 'a',
        'dopamine': 'd',
        'glutamate': 'g',
        'serotonin': 's',
        'unknown': 'u',
        'tyramine': 't',
        'octopamine': 'o',
        'GABA': 'G'
    }

    compressed_pair_classification = {
        'increase': 'i',
        'decrease': 'd',
        'stable': 's',
        'postembryonic': 'p',
        'variable': 'v'
    }

    for neuron in m['neurons']:
        neuron['types'] = ''.join(
            [neuron_type_to_compressed_type[t] for t in neuron['types']])
        neuron['neurotransmitterTypes'] = ''.join(
            [neuron_neurotransmitter_type_to_compressed_type[nt] for nt in neuron['neurotransmitterTypes']])

        neuron[neuron_field_key_to_compressed_key['class']] = neuron['class']
        neuron[neuron_field_key_to_compressed_key['types']] = neuron['types']
        neuron[neuron_field_key_to_compressed_key['neurotransmitterTypes']
               ] = neuron['neurotransmitterTypes']
        neuron[neuron_field_key_to_compressed_key['classMembers']
               ] = neuron['classMembers']

        del neuron['class']
        del neuron['types']
        del neuron['neurotransmitterTypes']
        del neuron['classMembers']

    for pre_index, pre in enumerate(neuronsSorted):
        for post_index, post in enumerate(neuronsSorted):
            key = neuron_pair_key(pre, post)
            compressed_key = neuron_pair_key(pre_index, post_index)
            annotations = m['neuronPairData'][key]['annotations']
            contactArea = m['neuronPairData'][key]['contactArea']
            cs = m['neuronPairData'][key]['connectivityCs']
            gj = m['neuronPairData'][key]['connectivityGj']

            if len(annotations) > 0:
                m['neuronPairData'][key][key_to_compressed_key['annotations']
                                             ] = [compressed_pair_classification[a] for a in m['neuronPairData'][key]['annotations']]

            if contactArea != None:
                m['neuronPairData'][key][key_to_compressed_key['contactArea']
                                             ] = m['neuronPairData'][key]['contactArea']

            if cs != None:
                m['neuronPairData'][key][key_to_compressed_key['connectivityCs']
                                             ] = m['neuronPairData'][key]['connectivityCs']

            if gj != None:
                m['neuronPairData'][key][key_to_compressed_key['connectivityGj']
                                             ] = m['neuronPairData'][key]['connectivityGj']

            del m['neuronPairData'][key]['annotations']
            del m['neuronPairData'][key]['contactArea']
            del m['neuronPairData'][key]['connectivityCs']
            del m['neuronPairData'][key]['connectivityGj']

            m['neuronPairData'][compressed_key] = m['neuronPairData'][key]


            del m['neuronPairData'][key]
            if m['neuronPairData'][compressed_key] == {}:
                del m['neuronPairData'][compressed_key]

def compress_model_lite(m):
    # prune empty values
    # a compressed model json file is about 6x smaller
    for pre in neuronsSorted:
        for post in neuronsSorted:
            key = neuron_pair_key(pre, post)
            annotations = m['neuronPairData'][key]['annotations']
            contactArea = m['neuronPairData'][key]['contactArea']
            cs = m['neuronPairData'][key]['connectivityCs']
            gj = m['neuronPairData'][key]['connectivityGj']

            if len(annotations) > 0:
                del m['neuronPairData'][key]['annotations']

            if contactArea == None:
                del m['neuronPairData'][key]['contactArea']

            if cs == None:
                del m['neuronPairData'][key]['connectivityCs']

            if gj == None:
                del m['neuronPairData'][key]['connectivityGj']

            if m['neuronPairData'][key] == {}:
                del m['neuronPairData'][key]


init_model()
add_datasets_to_model()
add_neuron_info_to_model()
add_contact_area_to_model()
add_connectivity_cs_to_model()
add_connectivity_gj_to_model()
add_annotations_to_model()

full_model = copy.deepcopy(model)
compress_model_lite(full_model)
with open('./scripts/model.json', 'w') as f:
    json.dump(full_model, f, indent=2)

compressed_model = copy.deepcopy(model)
compress_model_full(compressed_model)
with open('./scripts/model.compressed.json', 'w') as f:
    json.dump(compressed_model, f, separators=(',', ': '))
