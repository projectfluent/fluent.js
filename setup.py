#!/usr/bin/env python

from distutils.core import setup
import os

setup(name='l20n',
      version='1.0',
      description='Python L20n library',
      author='Zbigniew Braniecki',
      author_email='zbigniew@braniecki.net',
      url='https://github.com/zbraniecki/pyl20n',
      packages=['l20n',
                'l20n.compiler',
                'l20n.format',
                'l20n.format.lol'],
      package_dir = {
          'l20n': os.path.join('python', 'l20n'),
      }
     )

