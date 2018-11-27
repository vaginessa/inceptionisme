#!/bin/sh

export PATH=$PATH:/usr/local/cuda-7.0/bin
export LD_LIBRARY_PATH=:/usr/local/cuda-7.0/lib64

export CAFFE_ROOT=/home/wakka/caffe/
export CAFFE_HOME=/home/wakka/caffe/
export PYTHONPATH=/home/wakka/caffe/python:$PYTHONPATH

export LD_LIBRARY_PATH=/opt/OpenBLAS/lib/:${LD_LIBRARY_PATH}

cd /home/wakka
/usr/bin/python /var/dream-scripts/deepdream.py #> /home/wakka/deepdream.log



