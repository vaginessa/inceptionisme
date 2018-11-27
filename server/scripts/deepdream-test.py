#!/usr/bin/python
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
import random

import caffe

mode = "nomode" # test, prod, secondary

if __file__.endswith("deepdream-test.py"):
	mode = "test"
if __file__.endswith("deepdream.py"):
	mode = "prod"
if __file__.endswith("deepdream-secondary.py"):
	mode = "secondary"

print("file: "+__file__+" MODE: "+mode)
if mode == "nomode":
	sys.exit()

# change 0 to the identifier of the GPU you want to use
# this number can be found with nvidia-smi
if mode == "prod" or mode == "test":
	caffe.set_device(0)
	caffe.set_mode_gpu()

# net setup
model_path = '/home/wakka/caffe/models/bvlc_googlenet/' # substitute your path here
net_fn   = model_path + 'deploy.prototxt'
param_fn = model_path + 'bvlc_googlenet.caffemodel'

#if mode = "test":
#	model_path = '/home/wakka/more_models/cars/'
#	net_fn   = model_path + 'deploy.prototxt'
#	param_fn = model_path + 'googlenet_finetune_web_car_iter_10000.caffemodel'


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

def objective_L2(dst):
	dst.diff[:] = dst.data 

def make_step(net, step_size=1.5, end='inception_4c/output', jitter=32, clip=True, objective=objective_L2):
	'''Basic gradient ascent step.'''

	src = net.blobs['data'] # input image is stored in Net's 'data' blob
	dst = net.blobs[end]

	ox, oy = np.random.randint(-jitter, jitter+1, 2)
	src.data[0] = np.roll(np.roll(src.data[0], ox, -1), oy, -2) # apply jitter shift
			
	net.forward(end=end)
	objective(dst)  # specify the optimization objective
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

guidesBasePath = "/var/dream-pictures/guides"
gpuLockPath = "/var/dream-pictures/gpu.lock"

if mode == "prod":
	imagesBasePath = "/var/dream-pictures"
	imagesNew = imagesBasePath + "/new"
	imagesDreaming = imagesBasePath + "/dreaming"
	imagesDone = imagesBasePath + "/done"
	imagesDreams = "/var/www/default/dreams"
if mode == "secondary":
	imagesBasePath = "/var/dream-pictures/secondary"
	imagesNew = imagesBasePath + "/new"
	imagesDreaming = imagesBasePath + "/dreaming"
	imagesDone = imagesBasePath + "/done"
	imagesDreams = "/var/www/default/dreams"
if mode == "test":
	imagesBasePath = "/var/dream-pictures/test"
	imagesNew = imagesBasePath + "/new"
	imagesDreaming = imagesBasePath + "/dreaming"
	imagesDone = imagesBasePath + "/done"
	imagesDreams = "/var/www/default/dreams/test"


while True:

	sleepTime = 0.5 + (random.random() * 1.5) 
	print("sleeping for "+str(sleepTime)+" ...")
	time.sleep(sleepTime)

	if not os.path.isfile(gpuLockPath) or mode == "secondary":
		# lock GPU
		if (mode != "secondary"):
			print("locking GPU!")
			open(gpuLockPath, 'a').close()				

		for file in os.listdir(imagesNew):
			
			try:
				if file.endswith(".jpg") and os.path.isfile(imagesNew+"/"+file):
					print("#############################")
					print("dreaming: "+file)

					tempRandFilename = file+"_"+str(random.randint(111111, 999999))
					shutil.move(imagesNew+'/'+file, imagesDreaming+'/'+tempRandFilename)
					print("moved")

					# load input image
					img = np.float32(PIL.Image.open(imagesDreaming+'/'+tempRandFilename))
					print("img opened")

					# do dream
					dreamed = img #failsafe

					if (file.startswith("guided_")):
						print("guided dream!")

						guideId = file.split("_")
						guideId = guideId[1]

						guideImg = PIL.Image.open(guidesBasePath+"/"+guideId+".jpg")
						guideImg = guideImg.resize((224, 224), PIL.Image.ANTIALIAS)
						guide = np.float32(guideImg)

						end = 'inception_3b/output'
						h, w = guide.shape[:2]
						src, dst = net.blobs['data'], net.blobs[end]
						src.reshape(1,3,h,w)
						src.data[0] = preprocess(net, guide)
						net.forward(end=end)
						guide_features = dst.data[0].copy()

						def objective_guide(dst):
							x = dst.data[0].copy()
							y = guide_features
							ch = x.shape[0]
							x = x.reshape(ch,-1)
							y = y.reshape(ch,-1)
							A = x.T.dot(y) # compute the matrix of dot-products with guide features
							dst.diff[0].reshape(ch,-1)[:] = y[:,A.argmax(1)] # select ones that match best

						dreamed=deepdream(net, img, 9, end=end, objective=objective_guide)
					elif (file.startswith("eyes_and_orbs_")):
						dreamed=deepdream(net, img, end='inception_4a/1x1') # eyes and orbs
					elif (file.startswith("machine_madness_")):
						dreamed=deepdream(net, img, end='inception_5a/pool_proj') # machine madness
					elif (file.startswith("inception_")):
						dreamed=deepdream(net, img, end='inception_3b/5x5_reduce')
					elif (file.startswith("iterative_arcs_")):
						dreamed=deepdream(net, img, end='inception_4a/5x5') # iterative arcs
					elif (file.startswith("snake_eyes_")):
						dreamed=deepdream(net, img, end='inception_4a/5x5_reduce') # snake eyes
					elif (file.startswith("fluffy_stuff_")):
						dreamed=deepdream(net, img, end='inception_4c/1x1') # furry stuff
					elif (file.startswith("fractal_birdcars_")):
						dreamed=deepdream(net, img, end='inception_4d/3x3') # fractal birds and cars
					elif (file.startswith("alien_gods_")):
						dreamed=deepdream(net, img, end='inception_4e/5x5_reduce') # alien gods
					elif (file.startswith("normal_slightly_")):
						dreamed=deepdream(net, img, 3) 
					elif (file.startswith("normal_hardcore_")):
						dreamed=deepdream(net, img, 9)
						dreamed=deepdream(net, dreamed, 9)
					else: # normal puppy slug chaos
						dreamed=deepdream(net, img, 9)
					# this is only for cars model!
					#dreamed=deepdream(net, img, end='inception_4a_output')

					print("dreamed")
					PIL.Image.fromarray(np.uint8(dreamed)).save(imagesDreams+"/"+file)
					print("saved")
					shutil.move(imagesDreaming+'/'+tempRandFilename, imagesDone+'/'+file)
					print("moxed to done")

					# delete original file
					#os.remove(imagesDone+'/'+file)

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
					#	 frame = deepdream(net, frame)
					#	 PIL.Image.fromarray(np.uint8(frame)).save("/dst/frames/%04d.jpg"%frame_i)
					#	 frame = nd.affine_transform(frame, [1-s,1-s,1], [h*s/2,w*s/2,0], order=1)
					#	 frame_i += 1
			except:
				print "Unexpected error:", sys.exc_info()
				#print(traceback.format_exc())

		# unlock GPU
		if (mode != "secondary"):
			os.remove(gpuLockPath)
			print("unlocked GPU!")

	else:
		print("GPU is locked...")

	print("#############################")

	now = time.time()
	doDelete = True

	try:
		if doDelete:
			cleanPath = imagesDreams
			for file in os.listdir(cleanPath):
				filepath = os.path.join(cleanPath, file)
				if os.stat(filepath).st_ctime < now - 3600:
					if os.path.isfile(filepath):
						print("deleting old dream: "+filepath)
						os.remove(filepath)
		
			cleanPath = imagesNew
			for file in os.listdir(cleanPath):
				filepath = os.path.join(cleanPath, file)
				if os.stat(filepath).st_ctime < now - 3600:
					if os.path.isfile(filepath):
						print("deleting stale in new: "+filepath)
						os.remove(filepath)
		
			cleanPath = imagesDreaming
			for file in os.listdir(cleanPath):
				filepath = os.path.join(cleanPath, file)
				if os.stat(filepath).st_ctime < now - 3600:
					if os.path.isfile(filepath):
						print("deleting stale in dreaming: "+filepath)
						os.remove(filepath)
		
			cleanPath = imagesDone
			for file in os.listdir(cleanPath):
				filepath = os.path.join(cleanPath, file)
				if os.stat(filepath).st_ctime < now - 3600:
					if os.path.isfile(filepath):
						print("deleting stale in done: "+filepath)
						os.remove(filepath)
	except:
		print "Unexpected error:", sys.exc_info()[0]		

	print("#############################")











