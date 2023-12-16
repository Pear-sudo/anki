import os
import re, json
import bs4.element
from bs4 import BeautifulSoup as bs
from datetime import datetime


def text_combiner(t):
    passage = ""
    for i in t:
        passage += i
    return passage


def senses2sense_dict(senses, meaning_dic, dic_key='senses', counter=1):
    senses = senses
    meaning_dic = meaning_dic
    dic_key = dic_key

    senses_list = senses.find_all('li', class_='sense', recursive=False)
    if len(senses_list) == 0 and counter < 10:  # Yes, they have multiple senses but those senses are catagorized. propose It should also be noticed that the word do not have sense at all but idioms.
        span_list = senses.find_all('span', recursive=False)
        for span in span_list:
            li_list = span.find_all('li', recursive=False)
            if len(li_list) == 1:
                span.replace_with(li_list[0])
            elif len(li_list) > 1:
                for li in li_list:
                    span.parent.append(li)
                span.decompose()
        counter += 1
        senses2sense_dict(senses, meaning_dic, dic_key, counter=counter)

    else:
        for sense in senses_list:
            sense_dic = {}  # Will be added to the list of 'senses'

            try:
                sense_dic['countability'] = text_combiner(sense.find('span', class_='grammar').strings)
            except AttributeError:
                sense_dic['countability'] = ''

            try:
                sense_dic['defination'] = text_combiner(sense.find('span', class_='def').strings)
            except AttributeError:
                # print(word)
                # exit()
                try:
                    sense_dic['defination'] = text_combiner(
                        sense.find('span', class_='use').strings)  # suffix e.g. '-ally'
                except AttributeError:
                    sense_dic['defination'] = text_combiner(
                        sense.find('span', class_='xrefs').strings)  # e.g. anemia it is a link to another words

            sense_dic['examples'] = []
            try:
                examples = sense.find('ul', class_='examples').children
                for ex in examples:
                    ex = text_combiner(ex.strings)
                    sense_dic['examples'].append(ex)
            except AttributeError:
                pass

            meaning_dic[dic_key].append(sense_dic)  # The indentition here is very very important!!!

    return meaning_dic


def find_file(extension: str, directory: str = '.', descending: bool = True, num: int = 1) -> list[str]:
    filtered_files: list[tuple[str, float]] = []
    with os.scandir(directory) as it:
        for file in it:
            if file.is_dir() or file.name.split('.')[-1] != extension:
                continue
            file_info = (file.path, file.stat().st_mtime)
            filtered_files.append(file_info)
    filtered_files.sort(key=lambda f_info: f_info[1], reverse=(not descending))
    max_num = len(filtered_files)
    if num > max_num:
        num = max_num
    r = filtered_files[max_num - num:]
    if type(r) is not list:
        r = [r]
    return [ff[0] for ff in r]


target_file = find_file('html')[0]
html = open(target_file, "r", encoding="utf-8")  # You must include 'encoding'
soup = bs(html, 'lxml')
# print(len())

dic = {}

entries = soup.table.tbody.find_all('tr', recursive=False)
for entry in entries:
    fields = entry.find_all('td', recursive=False)

    word = fields[1].string
    dic[word] = {}

    try:
        phonetics = fields[-1].find('span', class_='phonetics').stripped_strings
        dic[word]['phonetics'] = list(phonetics)
    except AttributeError:  # This might be a phase
        dic[word]['phonetics'] = []

    dic[word]['meanings'] = []
    meanings = fields[-1].find_all('div', id='entryContent', recursive=False)
    for meaning in meanings:  # Meaning here refer to pos, differ from sense !!!
        meaning_dic = {}  # This(ese) dic(s) will be added to a dictionary list at the end of this 'for'

        pos = meaning.find_all('span', class_='pos')
        if len(pos) < 1:  # If pos doesn't exist
            pos = meaning.find('span',
                               string='(old use)')  # Old English do not have pos, but they are not the only ones
            if pos != None:
                pos_explain = pos.previous_sibling
                if type(pos_explain) == bs4.element.NavigableString:
                    pos_explain = pos.previous_sibling.previous_sibling

                if pos_explain.find(string=re.compile(word)) != None:  # Old English and has some explainations
                    meaning_dic['pos'] = pos_explain.string + '\n' + '(old use)'
                else:  # Old English without further explaination
                    meaning_dic['pos'] = '(old use)'
            elif pos == None:  # Those words just do not have pos
                meaning_dic['pos'] = ''
        elif len(pos) >= 1:  # If pos exists
            meaning_dic['pos'] = pos[0].string
            if meaning_dic['pos'] == None:
                meaning_dic['pos'] = text_combiner(pos[0].stripped_strings)

        """
        when I first realize that pos could not exist, I could not believe it!
        Then I find that the word 'fringe' has two 'pos' in a meaning??!!
        The I find the second 'pos' class is in the idiom of that meaning.
        I still think one meaning should only have one pos.
        So I will ignore the following ones.
        
        try:
            debug_if_pos_exists =  meaning_dic['pos']
        except KeyError:
            print(word)
            print(meaning)
            exit()
        """

        meaning_dic['senses'] = []
        senses = meaning.div.find('ol',
                                  class_='senses_multiple')  # Idioms should be processed seperately, because it also has 'single' or 'multiple'.
        if senses != None:
            meaning_dic = senses2sense_dict(senses, meaning_dic)
        else:
            senses = meaning.div.find('ol', class_='sense_single')
            if senses != None:
                meaning_dic = senses2sense_dict(senses, meaning_dic)
            else:
                pass
        dic[word]['meanings'].append(meaning_dic)

        dic[word]['meanings'][-1]['idioms'] = []
        idioms = meaning.div.find('div', class_='idioms')
        if idioms == None:
            pass
        else:
            idioms_list = idioms.find_all('span', class_='idm-g', recursive=False)
            for idiom in idioms_list:
                idiom_dic = {}

                idiom_dic['name'] = text_combiner(idiom.div.strings)

                idiom_dic['explains'] = []
                idiom_explain = idiom.find('ol', class_='sense_single', recursive=False)
                if idiom_explain != None:
                    idiom_dic = senses2sense_dict(idiom_explain, idiom_dic, 'explains')
                else:
                    idiom_explain = idiom.find('ol', class_='senses_multiple', recursive=False)
                    if idiom_explain != None:
                        idiom_dic = senses2sense_dict(idiom_explain, idiom_dic, 'explains')
                    else:
                        pass
                # print(idiom_dic)
                dic[word]['meanings'][-1]['idioms'].append(idiom_dic)


# print(dic['premium'])
# print(dic['propose'])

def list_order_no_dup(seq):
    seen = set()
    seen_add = seen.add
    return [x for x in seq if not (x in seen or seen_add(x))]


def list_text_combiner(li, seperater=' ', head='', tail='', cleaner='', duplate='True'):
    out = ''
    if duplate == False:
        li = list_order_no_dup(li)

    for i in li:
        if i == cleaner:
            continue
        out += i + seperater
    if len(seperater) != 0:
        out = out[:-len(seperater)]
    return head + out + tail


def level_of_meaning_to_out(out, meanings, senses_alia='senses', pos_alia='pos', malware=False):
    out = out
    meanings = meanings

    for meaning in meanings:
        if pos_alia == 'pos':
            out += '<h1>' + meaning[pos_alia] + '</h1>'
            malware = False
        else:
            out += "<h1 class='idioms'>" + meaning[pos_alia] + '</h1>'

        senses = meaning[senses_alia]
        tmp_senses = ''
        for sense in senses:
            temp_examples = ''
            if len(sense['examples']) != 0:
                temp_examples = list_text_combiner(sense['examples'], seperater='</li><li>',
                                                   head="<ul class='examples'><li>", tail='</li></ul>')

            if senses_alia == 'senses':
                tmp_sense = '<li>' + sense['countability'] + ' ' * 3 + sense['defination'] + '</li>'
            else:
                tmp_sense = '<li>' + sense['defination'] + '</li>'
            tmp_sense += temp_examples
            tmp_senses += tmp_sense
        if malware == False:
            try:
                idioms = meaning['idioms']
            except KeyError:
                print(word)
                print(meaning)
            malware = True
            out2 = ''
            out += '<ol>' + tmp_senses + '</ol>'
            out += level_of_meaning_to_out(out2, idioms, senses_alia='explains', pos_alia='name', malware=malware)
        elif malware == True:
            out += '<ol>' + tmp_senses + '</ol>'
    return out


dirty = json.dumps(dic)
clean = dirty.replace('|', '')
dic = json.loads(clean)

file_name = 'new_words__' + datetime.now().strftime("%m_%d_%Y__%H_%M_%S") + '.txt'

with open(file_name, 'w', encoding='utf-8') as f:
    for word in dic.keys():
        out = word + '|'

        phonetics = dic[word]['phonetics']
        indices = [i for i, x in enumerate(phonetics) if x == ","]
        if len(phonetics) == 0:
            out += ' ' + '|'
        elif len(phonetics) == 2:
            out += list_text_combiner(phonetics, seperater='<br>') + '|'
        elif len(phonetics) > 2:
            for indi in indices:
                phonetics[indi - 1] += ', ' + phonetics[indi + 1]
                phonetics[indi], phonetics[indi + 1] = '', ''
            out += list_text_combiner(phonetics, seperater='<br>') + '|'
        else:
            print('!')

        meanings = dic[word]['meanings']
        out = level_of_meaning_to_out(out, meanings)
        out = out.replace('\n', '')
        """
        trash_indices = [m.start() for m in re.finditer('\n', out)]
        if len(trash_indices) != 0:
            print(len(trash_indices))
        """
        f.write(out + '\n')
# break
