import unittest
import os

import l20n

data_dir = os.path.join(
               os.path.abspath(os.path.dirname(__file__)),
               'data')

class L20nLibTestCase(unittest.TestCase):

    def test_new_context(self):
        self.assertEqual(type(l20n.createContext('test')), l20n.Context)


    def test_add_reference(self):
        ctx = l20n.createContext('test')
        self.assertEqual(ctx.addReference(os.path.join(data_dir, 'example1')), True)
        

    def test_get_entity(self):
        ctx = l20n.createContext('test')
        ctx.addReference(os.path.join(data_dir, 'example1'))
        self.assertEqual(ctx.get('foo'), 'foo1')

    def test_get_attributes(self):
        ctx = l20n.createContext('test')
        ctx.addReference(os.path.join(data_dir, 'example1'))

    def test_get_data(self):
        ctx = l20n.createContext('test')
        ctx.addReference(os.path.join(data_dir, 'example1'))

    def test_cache(self):
        ctx = l20n.createContext('test')
        ctx.addReference(os.path.join(data_dir, 'example1'))
        self.assertEqual(ctx.get('foo'), 'foo1')

if __name__ == '__main__':
    unittest.main()
