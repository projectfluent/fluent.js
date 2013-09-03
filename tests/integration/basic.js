var L20n = process.env.L20N_COV
  ? require('../../build/cov/lib/l20n')
  : require('../../lib/l20n');

describe('A simple context with linkResource', function() {
  var ctx;
  beforeEach(function(done) {
    ctx = L20n.getContext();
    ctx.ready(done);
    ctx.linkResource(__dirname + '/fixtures/basic.properties');
    ctx.registerLocales('en-US'); // needed for the plural rule
    ctx.requestLocales();
  });

  it('should return the string value of brandName', function() {
    var value = ctx.get('brandName');
    value.should.equal('Firefox');
  })
  it('should return the value of about with the value of brandName in it', function() {
    var value = ctx.get('about');
    value.should.equal('About Firefox');
  })
  it('should return the value of cert with the value of organization passed directly', function() {
    var value = ctx.get('cert', {organization: 'Mozilla Foundation'});
    value.should.equal('Certificate signed by Mozilla Foundation');
  })
  it('should return the correct plural form for 0', function() {
    var value = ctx.get('unreadMessages', {unread: 0});
    value.should.equal('0 unread');
  })
  it('should return the correct plural form for 1', function() {
    var value = ctx.get('unreadMessages', {unread: 1});
    value.should.equal('One unread');
  })
  it('should return the correct plural form for 2', function() {
    var value = ctx.get('unreadMessages', {unread: 2});
    value.should.equal('2 unread');
  })
  it('should return the correct plural form for 3', function() {
    var value = ctx.get('unreadMessages', {unread: 3});
    value.should.equal('3 unread');
  })
});

