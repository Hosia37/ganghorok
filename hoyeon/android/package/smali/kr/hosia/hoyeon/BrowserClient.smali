.class public Lkr/hosia/hoyeon/BrowserClient;
.super Landroid/webkit/WebViewClient;
.method public constructor <init>()V
 .locals 0
 invoke-direct {p0}, Landroid/webkit/WebViewClient;-><init>()V
 return-void
.end method
.method public shouldOverrideUrlLoading(Landroid/webkit/WebView;Ljava/lang/String;)Z
 .locals 4
 const-string v0, "https://chatgpt.com/library?"
 invoke-virtual {p2,v0}, Ljava/lang/String;->startsWith(Ljava/lang/String;)Z
 move-result v0
 if-eqz v0, :blocked
 :try_start
 new-instance v0, Landroid/content/Intent;
 const-string v1, "android.intent.action.VIEW"
 invoke-static {p2}, Landroid/net/Uri;->parse(Ljava/lang/String;)Landroid/net/Uri;
 move-result-object v2
 invoke-direct {v0,v1,v2}, Landroid/content/Intent;-><init>(Ljava/lang/String;Landroid/net/Uri;)V
 invoke-virtual {p1}, Landroid/webkit/WebView;->getContext()Landroid/content/Context;
 move-result-object v3
 invoke-virtual {v3,v0}, Landroid/content/Context;->startActivity(Landroid/content/Intent;)V
 :try_end
 .catch Landroid/content/ActivityNotFoundException; {:try_start .. :try_end} :blocked
 :blocked
 const/4 v0, 0x1
 return v0
.end method
