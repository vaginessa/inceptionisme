#!/bin/sh


export PATH=$PATH:/usr/local/cuda-7.0/bin
export LD_LIBRARY_PATH=:/usr/local/cuda-7.0/lib64

export CAFFE_ROOT=/home/ubuntu/caffe/
export CAFFE_HOME=/home/ubuntu/caffe/
export PYTHONPATH=/home/ubuntu/caffe/python:$PYTHONPATH

export LD_LIBRARY_PATH=/usr/local/OpenBLAS/lib/:${LD_LIBRARY_PATH}

cd /home/ubuntu
/usr/bin/python /home/ubuntu/deepdream.py > /home/ubuntu/deepdream.log &


