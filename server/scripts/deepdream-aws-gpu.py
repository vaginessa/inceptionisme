# imports and basic notebook setup
from cStringIO import StringIO
import numpy as np
import scipy.ndimage as nd
import PIL.Image
from IPython.display import clear_output, Image, display
from google.protobuf import text_format
import os
import time
import sys
import shutil

import caffe


# change 0 to the identifier of the GPU you want to use
# this number can be found with nvidia-smi
caffe.set_device(0)
caffe.set_mode_gpu()

# net setup
model_path = '/home/ubuntu/caffe/models/bvlc_googlenet/' # substitute your path here
net_fn   = model_path + 'deploy.prototxt'
param_fn = model_path + 'bvlc_googlenet.caffemodel'

# Patching model to be able to compute gradients.
# Note that you can also manually add "force_backward: true" line to "deploy.prototxt".
model = caffe.io.caffe_pb2.NetParameter()
text_format.Merge(open(net_fn).read(), model)
model.force_backward = True
open('tmp.prototxt', 'w').write(str(model))

net = caffe.Classifier('tmp.prototxt', param_fn,
                       mean = np.float32([104.0, 116.0, 122.0]), # ImageNet mean, training set dependent
                       channel_swap = (2,1,0)) # the reference model has channels in BGR order instead of RGB



def showarray(a, fmt='jpeg'):
    a = np.uint8(np.clip(a, 0, 255))
    f = StringIO()
    PIL.Image.fromarray(a).save(f, fmt)
    display(Image(data=f.getvalue()))

# a couple of utility functions for converting to and from Caffe's input image layout
def preprocess(net, img):
    return np.float32(np.rollaxis(img, 2)[::-1]) - net.transformer.mean['data']
def deprocess(net, img):
    return np.dstack((img + net.transformer.mean['data'])[::-1])

def make_step(net, step_size=1.5, end='inception_4c/output', jitter=32, clip=True):
    '''Basic gradient ascent step.'''

    src = net.blobs['data'] # input image is stored in Net's 'data' blob
    dst = net.blobs[end]

    ox, oy = np.random.randint(-jitter, jitter+1, 2)
    src.data[0] = np.roll(np.roll(src.data[0], ox, -1), oy, -2) # apply jitter shift
            
    net.forward(end=end)
    dst.diff[:] = dst.data  # specify the optimization objective
    net.backward(start=end)
    g = src.diff[0]
    # apply normalized ascent step to the input image
    src.data[:] += step_size/np.abs(g).mean() * g

    src.data[0] = np.roll(np.roll(src.data[0], -ox, -1), -oy, -2) # unshift image
            
    if clip:
        bias = net.transformer.mean['data']
        src.data[:] = np.clip(src.data, -bias, 255-bias)    

def deepdream(net, base_img, iter_n=10, octave_n=4, octave_scale=1.4, end='inception_4c/output', clip=True, **step_params):
    # prepare base images for all octaves
    octaves = [preprocess(net, base_img)]
    for i in xrange(octave_n-1):
        octaves.append(nd.zoom(octaves[-1], (1, 1.0/octave_scale,1.0/octave_scale), order=1))
    
    src = net.blobs['data']
    detail = np.zeros_like(octaves[-1]) # allocate image for network-produced details
    for octave, octave_base in enumerate(octaves[::-1]):
        h, w = octave_base.shape[-2:]
        if octave > 0:
            # upscale details from the previous octave
            h1, w1 = detail.shape[-2:]
            detail = nd.zoom(detail, (1, 1.0*h/h1,1.0*w/w1), order=1)

        src.reshape(1,3,h,w) # resize the network's input image size
        src.data[0] = octave_base+detail
        for i in xrange(iter_n):
            make_step(net, end=end, clip=clip, **step_params)
            
            # visualization
            vis = deprocess(net, src.data[0])
            if not clip: # adjust image contrast if clipping is disabled
                vis = vis*(255.0/np.percentile(vis, 99.98))
            showarray(vis)
            print octave, i, end, vis.shape
            clear_output(wait=True)
            
        # extract details produced on the current octave
        detail = src.data[0]-octave_base
    # returning the resulting image
    return deprocess(net, src.data[0])


# os.mkdirs('/src/new')
# os.mkdirs('/src/dreaming')
# os.mkdirs('/src/done')

imagesBasePath = "/var/dream-pictures"
imagesNew = imagesBasePath + "/new"
imagesDreaming = imagesBasePath + "/dreaming"
imagesDone = imagesBasePath + "/done"
imagesDreams = "/var/www/default/dreams"

while True:

    for file in os.listdir(imagesNew):
        if file.endswith(".jpg"):
            print("#############################")
            print("dreaming: "+file)

            shutil.move(imagesNew+'/'+file, imagesDreaming+'/'+file)

            # load input image
            img = np.float32(PIL.Image.open(imagesDreaming+'/'+file))
            showarray(img)

            # do dream
            #_=deepdream(net, img, 3)
            dreamed=deepdream(net, img, 9) # was 9, i think
            #dreamed=deepdream(net, dreamed, 3)
            PIL.Image.fromarray(np.uint8(dreamed)).save(imagesDreams+"/"+file)

            shutil.move(imagesDreaming+'/'+file, imagesDone+'/'+file)

            # delete original file
            os.remove(imagesDone+'/'+file)

            # # dream abstract
            # _=deepdream(net, img, end='inception_3b/5x5_reduce')

            # # dream deeper
            # net.blobs.keys()

            # os.mkdirs('/dst/frames')
            # frame = img
            # frame_i = 0

            # h, w = frame.shape[:2]
            # s = 0.05 # scale coefficient
            # for i in xrange(100):
            #     frame = deepdream(net, frame)
            #     PIL.Image.fromarray(np.uint8(frame)).save("/dst/frames/%04d.jpg"%frame_i)
            #     frame = nd.affine_transform(frame, [1-s,1-s,1], [h*s/2,w*s/2,0], order=1)
            #     frame_i += 1

    print("#############################")

    now = time.time()

    cleanPath = imagesDreams
    for file in os.listdir(cleanPath):
        filepath = os.path.join(cleanPath, file)
        if os.stat(filepath).st_mtime < now - 3600:
            if os.path.isfile(filepath):
                print("deleting old dream: "+filepath)
                os.remove(filepath)

    cleanPath = imagesNew
    for file in os.listdir(cleanPath):
        filepath = os.path.join(cleanPath, file)
        if os.stat(filepath).st_mtime < now - 3600:
            if os.path.isfile(filepath):
                print("deleting old dream: "+filepath)
                os.remove(filepath)

    cleanPath = imagesDreaming
    for file in os.listdir(cleanPath):
        filepath = os.path.join(cleanPath, file)
        if os.stat(filepath).st_mtime < now - 3600:
            if os.path.isfile(filepath):
                print("deleting old dream: "+filepath)
                os.remove(filepath)

    cleanPath = imagesDone
    for file in os.listdir(cleanPath):
        filepath = os.path.join(cleanPath, file)
        if os.stat(filepath).st_mtime < now - 3600:
            if os.path.isfile(filepath):
                print("deleting old dream: "+filepath)
                os.remove(filepath)

    print("#############################")

    print("sleeping for 5 ...")
    time.sleep(5)








