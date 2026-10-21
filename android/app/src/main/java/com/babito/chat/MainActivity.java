package com.babito.chat;

import android.Manifest;
import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.ViewGroup;
import android.webkit.PermissionRequest;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

public class MainActivity extends Activity {
    static final String HOME = "https://flappychats.onrender.com/";
    static final String HOST = "flappychats.onrender.com";
    static final int REQ_FILE = 11, REQ_MIC = 12;
    WebView wv;
    ValueCallback<Uri[]> fileCb;
    PermissionRequest pendingPerm;

    @Override
    protected void onCreate(Bundle b) {
        super.onCreate(b);
        getWindow().setStatusBarColor(Color.parseColor("#0F1B2A"));
        getWindow().setNavigationBarColor(Color.parseColor("#0F1B2A"));
        wv = new WebView(this);
        wv.setBackgroundColor(Color.parseColor("#0F1B2A"));
        setContentView(wv, new ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
        WebSettings s = wv.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setCacheMode(WebSettings.LOAD_DEFAULT);
        s.setAllowFileAccess(false);
        wv.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest r) {
                Uri u = r.getUrl();
                if (HOST.equals(u.getHost())) return false;
                try { startActivity(new Intent(Intent.ACTION_VIEW, u)); } catch (Exception e) { }
                return true;
            }
            @Override
            public void onReceivedError(WebView v, WebResourceRequest r, WebResourceError e) {
                if (r.isForMainFrame()) {
                    String html = "<html dir='rtl'><body style='background:#0f1b2a;color:#fff;font-family:sans-serif;text-align:center;padding:40px 20px'>"
                        + "<h2>📴 ما اكو اتصال</h2><p>شغّل الإنترنت لأول مرة حتى تتحمّل اللعبة، بعدها تشتغل بدون نت.</p>"
                        + "<button style='font-size:18px;padding:10px 24px;border-radius:12px;border:0' onclick=\"location.href='" + HOME + "'\">إعادة المحاولة</button></body></html>";
                    v.loadDataWithBaseURL(HOME, html, "text/html", "utf-8", null);
                }
            }
        });
        wv.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(WebView v, ValueCallback<Uri[]> cb, FileChooserParams p) {
                if (fileCb != null) fileCb.onReceiveValue(null);
                fileCb = cb;
                try { startActivityForResult(p.createIntent(), REQ_FILE); } catch (Exception e) { fileCb = null; return false; }
                return true;
            }
            @Override
            public void onPermissionRequest(final PermissionRequest req) {
                runOnUiThread(() -> {
                    if (Build.VERSION.SDK_INT >= 23 && checkSelfPermission(Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
                        pendingPerm = req;
                        requestPermissions(new String[]{Manifest.permission.RECORD_AUDIO}, REQ_MIC);
                    } else req.grant(req.getResources());
                });
            }
        });
        wv.setDownloadListener((url, ua, cd, mime, len) -> {
            try { startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url))); } catch (Exception e) { }
        });
        if (b != null) wv.restoreState(b); else wv.loadUrl(HOME);
    }

    @Override
    public void onRequestPermissionsResult(int code, String[] perms, int[] res) {
        super.onRequestPermissionsResult(code, perms, res);
        if (code == REQ_MIC && pendingPerm != null) {
            if (res.length > 0 && res[0] == PackageManager.PERMISSION_GRANTED) pendingPerm.grant(pendingPerm.getResources()); else pendingPerm.deny();
            pendingPerm = null;
        }
    }

    @Override
    protected void onActivityResult(int code, int result, Intent data) {
        if (code == REQ_FILE && fileCb != null) {
            fileCb.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(result, data));
            fileCb = null;
        } else super.onActivityResult(code, result, data);
    }

    @Override
    protected void onSaveInstanceState(Bundle b) { super.onSaveInstanceState(b); wv.saveState(b); }

    @Override
    protected void onPause() { super.onPause(); wv.onPause(); }

    @Override
    protected void onResume() { super.onResume(); wv.onResume(); }

    @Override
    public void onBackPressed() { if (wv.canGoBack()) wv.goBack(); else super.onBackPressed(); }
}
