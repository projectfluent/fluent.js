#!/usr/bin/python 
import re
import os
import l20n.format.lol.ast as ast
import l20n.format.lol.serializer as serializer

def read_file(path):
    with file(path) as f:
        return f.read()

def write_file(path, s):
    f = open(path, mode='w')
    f.write(s)
    f.close()

class PropertiesConverter:
    patterns = {
        'entity': re.compile('([^=]+)=(.+)'),
        'locale': re.compile('\[([a-zA-Z\-]+)\]'),
        'comment': re.compile('#(.*)')
    }

    def __init__(self, s):
        self.s = s.split('\n')
        self.lols = {}
        self._current_locale = None

    def parse(self):
        for line in self.s:
            self.get_token(line)
        return self.lols

    def get_token(self, line):
        s = line.strip()
        if len(s) == 0:
            return
        if s[0] == '[':
            locale = self.get_locale(s)
            return locale
        if s[0] == '#':
            return self.get_comment(s)
        return self.get_entity(s)

       
    def get_locale(self, line):
        m = self.patterns['locale'].match(line)
        if m:
            locale = m.group(1)
            self.lols[locale] = ast.LOL()
            self._current_locale = locale
            #print('locale: %s' % locale)

    def get_comment(self, line):
        m = self.patterns['comment'].match(line)
        if m:
            comment = m.group(1)
            #print('comment: %s' % comment)
            c = ast.Comment(comment)
            self.lols[self._current_locale].body.append(c)

    def get_entity(self, line):
        m = self.patterns['entity'].match(line)
        if m:
            id = m.group(1)
            val = m.group(2)
            #print("entity %s = %s" % (id, val))
            id = ast.Identifier(id)
            entity = ast.Entity(id)
            entity.value = ast.String(val)
            self.lols[self._current_locale].body.append(entity)


def convert():
    dpath = '/Users/zbraniecki/projects/mozilla/gaia/apps/homescreen/locale/'
    path = "/Users/zbraniecki/projects/mozilla/gaia/apps/homescreen/locale/homescreen.properties"
    f = read_file(path)
    pc = PropertiesConverter(f)
    lols = pc.parse()
    ser = serializer.Serializer()
    for (loc, lol) in lols.items():
        s = ser.serialize(lol)
        write_file(os.path.join(dpath, '%s.lol' % loc), s)

if __name__ == '__main__':
    convert()

