package org.brycem;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import android.os.Environment;
import android.content.Intent;
import android.net.Uri;
import android.util.Log;

public class ScanMedia extends CordovaPlugin {
    public static final String ACTION_MEDIASCANNER = "mediaScanner";
    private static final String LOGTAG = "scanmediaTag";
    private static final int STATE_RW = 0;
    private static final int STATE_READ = 1;
    private static final int STATE_UNKOWN = 2;
    
    @Override
    public boolean execute(String action, JSONArray args, CallbackContext callbackContext) throws JSONException 
    {
        if (!action.equals(ACTION_MEDIASCANNER)) 
        {
            Log.w(LOGTAG, "Wrong action detected: " + action);
            return false;
        }
        
        try 
        {
            String absolutePath = args.getString(0);
            if (absolutePath.startsWith("data:image")) 
            {
                absolutePath = absolutePath.substring(absolutePath.indexOf(',') + 1);
            }

            int storageState = getMediaStorageState();
            Log.d(LOGTAG, Integer.toString(storageState));
            
            switch(storageState)
            {
                case STATE_RW:
                    return this.mediaScanner(absolutePath, callbackContext);
                case STATE_READ:
                    callbackContext.error("Storage is Read Only.");
                    return false;
                case STATE_UNKOWN:
                    callbackContext.error("Storage does not have Read or Write Access");
                    return false;
            }

        } catch (JSONException e) {
            Log.e(LOGTAG, "Error: " + e.getMessage());
            e.printStackTrace();
            callbackContext.error(e.getMessage());
            return false;
        } catch (InterruptedException e) {
            Log.e(LOGTAG, "Error: " + e.getMessage());
            e.printStackTrace();
            callbackContext.error(e.getMessage());
            return false;
        }
        return true;
    }

    private boolean mediaScanner(String absolutePath, CallbackContext callbackContext) throws InterruptedException, JSONException
    {
        Log.d(LOGTAG, "mediaScanner: attempting to create new intent");
        
        Uri contentUri = Uri.parse(absolutePath);
        Log.d(LOGTAG, "mediaScanner: Uri= " + absolutePath);
        
        Intent mediaScanIntent = new Intent(Intent.ACTION_MEDIA_SCANNER_SCAN_FILE, contentUri);
        //File f = new File(filename);

        this.cordova.getActivity().sendBroadcast(mediaScanIntent);
        
        callbackContext.success();
        
        return true;
    }
    
    public static int getMediaStorageState()
    {
        final String state = Environment.getExternalStorageState();
        
        if(Environment.MEDIA_MOUNTED.equals(state))
        {
            return STATE_RW; //Read & Write
        }
        else if (Environment.MEDIA_MOUNTED_READ_ONLY.equals(state))
        {
            return STATE_READ; //Read Only
        }
        else
        {
            return STATE_UNKOWN; //No Read or Write access
        }
    }
}